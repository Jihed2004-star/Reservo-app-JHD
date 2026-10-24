using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Data;
using MyApp.Data.Entities;
using NpgsqlTypes;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AvailabilityController : ControllerBase
{
    private readonly AppDbContext _context;

    public AvailabilityController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<AvailabilityResponse>>> GetAll([FromQuery] Guid elementId)
    {
        var slots = await _context.Availabilities
            .Where(a => a.ElementId == elementId)
            .OrderBy(a => a.TimeRange)
            .Select(a => MapToResponse(a))
            .ToListAsync();

        return Ok(slots);
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPost]
    public async Task<ActionResult<AvailabilityResponse>> Create(AvailabilityRequest request)
    {
        if (request.EndTime <= request.StartTime)
        {
            return BadRequest(new { message = "EndTime must be after StartTime." });
        }

        var element = await _context.Elements
            .Include(e => e.Service)
            .FirstOrDefaultAsync(e => e.Id == request.ElementId);

        if (element is null)
        {
            return BadRequest(new { message = "ElementId does not reference an existing element." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        var availability = new Availability
        {
            ElementId = request.ElementId,
            TimeRange = new NpgsqlRange<DateTime>(request.StartTime, true, request.EndTime, false)
        };

        _context.Availabilities.Add(availability);
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(availability));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPost("generate")]
    public async Task<ActionResult<GenerateAvailabilityResponse>> Generate(GenerateAvailabilityRequest request)
    {
        var isFullDayPattern = request.StartTime == TimeOnly.MinValue && request.EndTime == TimeOnly.MinValue;

        if (!isFullDayPattern && request.EndTime <= request.StartTime)
        {
            return BadRequest(new { message = "EndTime must be after StartTime." });
        }

        if (request.ToDate < request.FromDate)
        {
            return BadRequest(new { message = "ToDate must be on or after FromDate." });
        }

        if (request.DaysOfWeek is null || request.DaysOfWeek.Count == 0)
        {
            return BadRequest(new { message = "At least one day of week must be specified." });
        }

        var element = await _context.Elements
            .Include(e => e.Service)
            .FirstOrDefaultAsync(e => e.Id == request.ElementId);

        if (element is null)
        {
            return BadRequest(new { message = "ElementId does not reference an existing element." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        var daysSet = request.DaysOfWeek.ToHashSet();

        // Compute the full date range up front so we only need ONE query
        // to fetch existing rows, instead of one query per candidate date.
        var rangeStart = DateTime.SpecifyKind(request.FromDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var rangeEnd = DateTime.SpecifyKind(request.ToDate.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var boundingRange = new NpgsqlRange<DateTime>(rangeStart, true, rangeEnd, false);

        var existingRanges = await _context.Availabilities
            .Where(a => a.ElementId == request.ElementId && a.TimeRange.Overlaps(boundingRange))
            .Select(a => a.TimeRange)
            .ToListAsync();

        var slotsToCreate = new List<Availability>();
        var skippedCount = 0;

        for (var date = request.FromDate; date <= request.ToDate; date = date.AddDays(1))
        {
            if (!daysSet.Contains(date.DayOfWeek))
            {
                continue;
            }

            var start = DateTime.SpecifyKind(date.ToDateTime(request.StartTime), DateTimeKind.Utc);
            var end = request.EndTime == TimeOnly.MinValue
                ? DateTime.SpecifyKind(date.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc)
                : DateTime.SpecifyKind(date.ToDateTime(request.EndTime), DateTimeKind.Utc);

            var candidate = new NpgsqlRange<DateTime>(start, true, end, false);

            var overlapsExisting = existingRanges.Any(r =>
                start < r.UpperBound && r.LowerBound < end);
            if (overlapsExisting)
            {
                skippedCount++;
                continue;
            }

            slotsToCreate.Add(new Availability
            {
                ElementId = request.ElementId,
                TimeRange = candidate
            });
        }

        _context.Availabilities.AddRange(slotsToCreate);
        await _context.SaveChangesAsync();

        return Ok(new GenerateAvailabilityResponse
        {
            SlotsCreated = slotsToCreate.Count,
            SlotsSkipped = skippedCount,
            FromDate = request.FromDate,
            ToDate = request.ToDate
        });
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var availability = await _context.Availabilities
            .Include(a => a.Element).ThenInclude(e => e.Service)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (availability is null)
        {
            return NotFound(new { message = "Availability slot not found." });
        }

        if (!IsOwnerOrAdmin(availability.Element.Service.ProviderId))
        {
            return Forbid();
        }

        var conflicts = await _context.Bookings
            .Where(b => b.ElementId == availability.ElementId
                     && b.Status == "Confirmed"
                     && b.TimeRange.Overlaps(availability.TimeRange))
            .Select(b => new BookingConflictDto
            {
                BookingId = b.Id,
                StartTime = b.TimeRange.LowerBound,
                EndTime = b.TimeRange.UpperBound
            })
            .ToListAsync();

        if (conflicts.Count > 0)
        {
            return Conflict(new
            {
                message = "This slot has confirmed bookings and can't be deleted.",
                conflictingBookings = conflicts
            });
        }

        _context.Availabilities.Remove(availability);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Removes one or more intervals from an element's availability in a single
    /// pass. Slots that are only partially covered are trimmed, and slots the
    /// intervals cut through are split into the ranges that stay bookable.
    /// </summary>
    [Authorize(Roles = "Provider,Admin")]
    [HttpPost("intervals/remove")]
    public async Task<ActionResult<RemoveAvailabilityIntervalResponse>> RemoveIntervals(
        RemoveAvailabilityIntervalsRequest request)
    {
        if (request.Intervals is null || request.Intervals.Count == 0)
        {
            return BadRequest(new { message = "At least one interval must be specified." });
        }

        if (request.Intervals.Any(i => i.EndTime <= i.StartTime))
        {
            return BadRequest(new { message = "EndTime must be after StartTime for every interval." });
        }

        var element = await _context.Elements
            .Include(e => e.Service)
            .FirstOrDefaultAsync(e => e.Id == request.ElementId);

        if (element is null)
        {
            return BadRequest(new { message = "ElementId does not reference an existing element." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        // Merge overlapping or adjacent intervals so no minute is removed twice.
        var removeRanges = MergeRanges(request.Intervals.Select(i => (i.StartTime, i.EndTime)));
        var span = new NpgsqlRange<DateTime>(removeRanges[0].Start, true, removeRanges[^1].End, false);

        var conflicts = await _context.Bookings
            .Where(b => b.ElementId == request.ElementId
                     && b.Status == "Confirmed"
                     && b.TimeRange.Overlaps(span))
            .Select(b => new BookingConflictDto
            {
                BookingId = b.Id,
                StartTime = b.TimeRange.LowerBound,
                EndTime = b.TimeRange.UpperBound
            })
            .ToListAsync();

        var realConflicts = conflicts
            .Where(b => removeRanges.Any(r => b.StartTime < r.End && r.Start < b.EndTime))
            .ToList();

        if (realConflicts.Count > 0)
        {
            return Conflict(new
            {
                message = "The selected intervals contain confirmed bookings and can't be removed.",
                conflictingBookings = realConflicts
            });
        }

        var overlappingSlots = await _context.Availabilities
            .Where(a => a.ElementId == request.ElementId && a.TimeRange.Overlaps(span))
            .OrderBy(a => a.TimeRange.LowerBound)
            .ToListAsync();

        if (overlappingSlots.Count == 0)
        {
            return NotFound(new { message = "No availability slot overlaps the selected intervals." });
        }

        var response = new RemoveAvailabilityIntervalResponse();
        var remainingRanges = new List<(DateTime Start, DateTime End)>();

        await using var transaction = await _context.Database.BeginTransactionAsync();

        foreach (var slot in overlappingSlots)
        {
            var lower = slot.TimeRange.LowerBound;
            var upper = slot.TimeRange.UpperBound;
            var remaining = SubtractRanges(lower, upper, removeRanges);

            _context.Availabilities.Remove(slot);

            if (remaining.Count == 0)
            {
                response.RemovedSlots++;
                continue;
            }

            remainingRanges.AddRange(remaining);
            response.TrimmedSlots++;
        }

        // Flush the deletes first so the replacement ranges never overlap the old rows.
        await _context.SaveChangesAsync();

        if (remainingRanges.Count > 0)
        {
            _context.Availabilities.AddRange(remainingRanges.Select(range => new Availability
            {
                ElementId = request.ElementId,
                TimeRange = new NpgsqlRange<DateTime>(range.Start, true, range.End, false)
            }));

            await _context.SaveChangesAsync();
        }

        response.CreatedSlots = remainingRanges.Count;

        await transaction.CommitAsync();

        return Ok(response);
    }

    private static List<(DateTime Start, DateTime End)> MergeRanges(
        IEnumerable<(DateTime Start, DateTime End)> ranges)
    {
        var merged = new List<(DateTime Start, DateTime End)>();

        foreach (var range in ranges.OrderBy(r => r.Start))
        {
            if (merged.Count > 0 && range.Start <= merged[^1].End)
            {
                var last = merged[^1];
                merged[^1] = (last.Start, range.End > last.End ? range.End : last.End);
                continue;
            }

            merged.Add(range);
        }

        return merged;
    }

    private static List<(DateTime Start, DateTime End)> SubtractRanges(
        DateTime slotStart,
        DateTime slotEnd,
        IEnumerable<(DateTime Start, DateTime End)> removals)
    {
        var remaining = new List<(DateTime Start, DateTime End)> { (slotStart, slotEnd) };

        foreach (var removal in removals)
        {
            var next = new List<(DateTime Start, DateTime End)>();

            foreach (var (start, end) in remaining)
            {
                if (removal.End <= start || removal.Start >= end)
                {
                    next.Add((start, end));
                    continue;
                }

                if (start < removal.Start)
                {
                    next.Add((start, removal.Start));
                }

                if (end > removal.End)
                {
                    next.Add((removal.End, end));
                }
            }

            remaining = next;
        }

        return remaining.Where(r => r.End > r.Start).ToList();
    }

    private bool IsOwnerOrAdmin(Guid ownerProviderId)
    {
        if (User.IsInRole("Admin"))
        {
            return true;
        }

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                        ?? User.FindFirst("sub")!.Value);

        return currentUserId == ownerProviderId;
    }

    private static AvailabilityResponse MapToResponse(Availability a) => new()
    {
        Id = a.Id,
        ElementId = a.ElementId,
        StartTime = a.TimeRange.LowerBound,
        EndTime = a.TimeRange.UpperBound,
        CreatedAt = a.CreatedAt
    };
}