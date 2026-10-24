using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Api.Services;
using MyApp.Data;
using MyApp.Data.Entities;

namespace MyApp.Api.Controllers;

/// <summary>
/// Provider-facing revenue analytics. Every figure is derived from the bookings
/// of the elements the caller owns, so a provider can never see another
/// provider's numbers.
/// </summary>
[ApiController]
[Route("api/provider")]
[Authorize(Roles = "Provider,Admin")]
public class ProviderRevenueController : ControllerBase
{
    /// <summary>How many rows the sales ledger returns.</summary>
    private const int LedgerSize = 50;

    private const string BookingStatusCompleted = "Completed";
    private const string BookingStatusCancelled = "Cancelled";
    private const string BookingStatusConfirmed = "Confirmed";

    private readonly AppDbContext _context;

    public ProviderRevenueController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("revenue")]
    public async Task<ActionResult<ProviderRevenueResponse>> GetRevenue()
    {
        var userId = GetCurrentUserId();

        var services = await _context.Services
            .Include(s => s.Elements)
            .Where(s => s.ProviderId == userId)
            .ToListAsync();

        var elements = services.SelectMany(s => s.Elements).ToList();
        var elementIds = elements.Select(e => e.Id).ToList();

        // One round trip for every booking; the aggregates below are cheap enough
        // to compute in memory and this keeps the money math in a single place.
        var bookings = elementIds.Count == 0
            ? new List<Booking>()
            : await _context.Bookings
                .Include(b => b.Element).ThenInclude(e => e.Service)
                .Include(b => b.User)
                .Where(b => elementIds.Contains(b.ElementId))
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();

        var now = DateTime.UtcNow;
        var priced = bookings
            .Select(b =>
            {
                var unit = b.Element.Service.BookingUnit;
                var units = RevenueCalculator.Units(unit, b.TimeRange.LowerBound, b.TimeRange.UpperBound);
                return new PricedBooking(b, unit, units, units * b.Element.Price, EffectiveStatus(b, now));
            })
            .ToList();

        var completed = priced.Where(p => p.Status == BookingStatusCompleted).ToList();
        var cancelled = priced.Where(p => p.Status == BookingStatusCancelled).ToList();
        var upcoming = priced.Where(p => p.Status == BookingStatusConfirmed).ToList();

        var totalEarned = completed.Sum(p => p.Amount);

        // Revenue is recognised when the booking window ends — that is also the
        // moment a booking becomes "Completed", so the two always agree.
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var lastMonthStart = monthStart.AddMonths(-1);

        var thisMonthRevenue = completed
            .Where(p => p.Booking.TimeRange.UpperBound >= monthStart)
            .Sum(p => p.Amount);
        var lastMonthRevenue = completed
            .Where(p => p.Booking.TimeRange.UpperBound >= lastMonthStart
                        && p.Booking.TimeRange.UpperBound < monthStart)
            .Sum(p => p.Amount);

        var response = new ProviderRevenueResponse
        {
            Financials = new RevenueFinancialsDto
            {
                TotalEarned = totalEarned,
                UpcomingRevenue = upcoming.Sum(p => p.Amount),
                ThisMonthRevenue = thisMonthRevenue,
                LastMonthRevenue = lastMonthRevenue,
                MonthOverMonthGrowth = ComputeGrowth(thisMonthRevenue, lastMonthRevenue),
                AverageBookingValue = completed.Count == 0
                    ? 0m
                    : Math.Round(totalEarned / completed.Count, 2),
                CancelledRevenue = cancelled.Sum(p => p.Amount),
                CompletedBookingsCount = completed.Count,
                UpcomingBookingsCount = upcoming.Count,
                CancelledBookingsCount = cancelled.Count
            },
            DailyRevenue = BuildDailySeries(completed, now),
            MonthlyRevenue = BuildMonthlySeries(completed, monthStart),
            ElementBreakdown = BuildElementBreakdown(elements, services, completed, totalEarned),
            Transactions = priced.Take(LedgerSize).Select(MapTransaction).ToList()
        };

        return Ok(response);
    }

    private sealed record PricedBooking(
        Booking Booking,
        BookingUnit Unit,
        decimal Units,
        decimal Amount,
        string Status);

    /// <summary>
    /// "Completed" is never stored — it is whatever a Confirmed booking becomes
    /// once its window has passed. This mirrors the rule used by the bookings API.
    /// </summary>
    private static string EffectiveStatus(Booking booking, DateTime now)
    {
        if (booking.Status == BookingStatusCancelled)
        {
            return BookingStatusCancelled;
        }

        return booking.TimeRange.UpperBound <= now ? BookingStatusCompleted : BookingStatusConfirmed;
    }

    private static double ComputeGrowth(decimal thisMonth, decimal lastMonth)
    {
        // A zero base has no meaningful percentage: report 100% when revenue
        // appeared out of nothing and 0% when both months are empty.
        if (lastMonth == 0m)
        {
            return thisMonth > 0m ? 100d : 0d;
        }

        return Math.Round((double)((thisMonth - lastMonth) / lastMonth) * 100d, 1);
    }

    private static List<DailyRevenueDto> BuildDailySeries(List<PricedBooking> completed, DateTime now)
    {
        var today = now.Date;
        var byDay = completed
            .GroupBy(p => p.Booking.TimeRange.UpperBound.Date)
            .ToDictionary(g => g.Key, g => g.ToList());

        var series = new List<DailyRevenueDto>(30);
        for (var offset = 29; offset >= 0; offset--)
        {
            var day = today.AddDays(-offset);
            byDay.TryGetValue(day, out var dayBookings);

            series.Add(new DailyRevenueDto
            {
                Date = day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Revenue = dayBookings?.Sum(p => p.Amount) ?? 0m,
                BookingsCount = dayBookings?.Count ?? 0
            });
        }

        return series;
    }

    private static List<MonthlyRevenueDto> BuildMonthlySeries(List<PricedBooking> completed, DateTime monthStart)
    {
        var series = new List<MonthlyRevenueDto>(12);
        for (var offset = 11; offset >= 0; offset--)
        {
            var start = monthStart.AddMonths(-offset);
            var end = start.AddMonths(1);

            var monthBookings = completed
                .Where(p => p.Booking.TimeRange.UpperBound >= start && p.Booking.TimeRange.UpperBound < end)
                .ToList();

            series.Add(new MonthlyRevenueDto
            {
                Month = start.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                Revenue = monthBookings.Sum(p => p.Amount),
                BookingsCount = monthBookings.Count
            });
        }

        return series;
    }

    private static List<ElementRevenueDto> BuildElementBreakdown(
        List<Element> elements,
        List<Service> services,
        List<PricedBooking> completed,
        decimal totalEarned)
    {
        var serviceById = services.ToDictionary(s => s.Id);

        return elements
            .Select(element =>
            {
                var service = serviceById[element.ServiceId];
                var elementBookings = completed
                    .Where(p => p.Booking.ElementId == element.Id)
                    .ToList();
                var revenue = elementBookings.Sum(p => p.Amount);

                return new ElementRevenueDto
                {
                    ElementId = element.Id,
                    ElementName = element.Name,
                    ServiceName = service.Name,
                    BookingUnit = service.BookingUnit.ToString(),
                    UnitPrice = element.Price,
                    CompletedBookingsCount = elementBookings.Count,
                    TotalUnitsSold = elementBookings.Sum(p => p.Units),
                    TotalRevenue = revenue,
                    PercentageOfTotal = totalEarned == 0m
                        ? 0d
                        : Math.Round((double)(revenue / totalEarned) * 100d, 1)
                };
            })
            .OrderByDescending(e => e.TotalRevenue)
            .ThenBy(e => e.ElementName)
            .ToList();
    }

    private static RevenueTransactionDto MapTransaction(PricedBooking priced) => new()
    {
        Id = priced.Booking.Id,
        BookingCode = BuildBookingCode(priced.Booking.Id),
        CustomerName = priced.Booking.User?.FullName ?? "Unknown customer",
        ServiceName = priced.Booking.Element.Service.Name,
        ElementName = priced.Booking.Element.Name,
        StartTime = priced.Booking.TimeRange.LowerBound,
        EndTime = priced.Booking.TimeRange.UpperBound,
        DurationFormatted = FormatDuration(priced.Unit, priced.Units),
        UnitPrice = priced.Booking.Element.Price,
        TotalAmount = priced.Amount,
        Status = priced.Status,
        CreatedAt = priced.Booking.CreatedAt
    };

    private static string BuildBookingCode(Guid id) =>
        $"BK-{id.ToString("N")[..8].ToUpperInvariant()}";

    private static string FormatDuration(BookingUnit unit, decimal units)
    {
        var amount = units.ToString("0.#", CultureInfo.InvariantCulture);
        var noun = unit switch
        {
            BookingUnit.Hourly => "hour",
            BookingUnit.Daily => "day",
            BookingUnit.Monthly => "month",
            _ => "unit"
        };

        return units == 1m ? $"1 {noun}" : $"{amount} {noun}s";
    }

    private Guid GetCurrentUserId()
    {
        var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")!.Value;
        return Guid.Parse(value);
    }
}
