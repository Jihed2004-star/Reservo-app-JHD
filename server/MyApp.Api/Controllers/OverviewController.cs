using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Api.Services;
using MyApp.Data;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OverviewController : ControllerBase
{
    private readonly AppDbContext _context;
    public OverviewController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<OverviewResponse>> Get()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);
        var user = await _context.Users.FindAsync(userId);
        if (user is null) return NotFound(new { message = "User not found." });

        var bookings = await _context.Bookings
            .Include(b => b.Element).ThenInclude(e => e.Service)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var now = DateTime.UtcNow;
        int upcoming = bookings.Count(b => b.TimeRange.UpperBound > now && b.Status == "Confirmed");
        int completed = bookings.Count(b => b.TimeRange.UpperBound <= now && b.Status != "Cancelled");
        int cancelled = bookings.Count(b => b.Status == "Cancelled");
        var reviewCountGiven = await _context.Reviews.CountAsync(r => r.UserId == userId);

        BookingResponse MapBooking(MyApp.Data.Entities.Booking b) => new()
        {
            Id = b.Id,
            ElementId = b.ElementId,
            ElementName = b.Element.Name,
            ServiceName = b.Element.Service.Name,
            StartTime = b.TimeRange.LowerBound,
            EndTime = b.TimeRange.UpperBound,
            Status = b.Status == "Cancelled" ? "Cancelled" : (b.TimeRange.UpperBound < now ? "Completed" : b.Status),
            CreatedAt = b.CreatedAt
        };

        var recent = bookings.Take(5).Select(MapBooking).ToList();
        var upcomingBookings = bookings.Where(b => b.TimeRange.LowerBound > now && b.Status == "Confirmed").Take(5).Select(MapBooking).ToList();

        var stats = new OverviewStats
        {
            TotalBookings = bookings.Count,
            UpcomingCount = upcoming,
            CompletedCount = completed,
            CancelledCount = cancelled,
            ReviewCount = reviewCountGiven
        };

        List<ServiceResponse> myServices = new();
        ProviderStatsDto? providerStats = null;
        List<IncomingBookingDto>? recentIncoming = null;
        List<ReviewReceivedDto>? latestReviews = null;
        List<BookingsByDayDto>? bookingsByDay = null;
        PlatformStatsDto? platformStats = null;
        List<RecentUserDto>? recentUsers = null;
        List<TopProviderDto>? topProviders = null;
        List<BookingsByDayDto>? platformBookingsByDay = null;

        if (user.Role == "Provider" || user.Role == "Admin")
        {
            var services = await _context.Services.Where(s => s.ProviderId == userId).Include(s => s.Elements).ToListAsync();
            var elementIds = services.SelectMany(s => s.Elements).Select(e => e.Id).ToList();
            stats.ServicesCount = services.Count;
            stats.ElementsCount = elementIds.Count;
            double provAvg = 0;
            int provReviewCount = 0;
            if (elementIds.Count > 0)
            {
                var ratings = await _context.Reviews.Where(r => elementIds.Contains(r.ElementId)).Select(r => r.Rating).ToListAsync();
                if (ratings.Count > 0) { provAvg = Math.Round(ratings.Average(), 1); provReviewCount = ratings.Count; }
            }
            stats.AverageRating = provAvg;
            List<MyApp.Data.Entities.Booking> receivedBookings = new();
            decimal revenue = 0m;
            int bookingsReceived = 0;
            if (elementIds.Count > 0)
            {
                receivedBookings = await _context.Bookings
                    .Include(b => b.Element).ThenInclude(e => e.Service)
                    .Include(b => b.User)
                    .Where(b => elementIds.Contains(b.ElementId))
                    .OrderByDescending(b => b.CreatedAt)
                    .ToListAsync();
                bookingsReceived = receivedBookings.Count;
                // Unit-based: price × billable units, not just the element price.
                revenue = receivedBookings
                    .Where(b => b.Status != "Cancelled" && b.TimeRange.UpperBound <= now)
                    .Sum(RevenueCalculator.Amount);
            }
            providerStats = new ProviderStatsDto
            {
                BookingsReceived = bookingsReceived,
                AvgRating = provAvg,
                ReviewCount = provReviewCount,
                ServicesCount = services.Count,
                ElementsCount = elementIds.Count,
                Revenue = revenue
            };
            recentIncoming = receivedBookings.Take(5).Select(b => new IncomingBookingDto
            {
                Id = b.Id,
                ElementName = b.Element.Name,
                ServiceName = b.Element.Service.Name,
                CustomerName = b.User.FullName,
                StartTime = b.TimeRange.LowerBound,
                Status = b.Status
            }).ToList();
            if (elementIds.Count > 0)
            {
                var revs = await _context.Reviews.Include(r => r.User).Include(r => r.Element).Where(r => elementIds.Contains(r.ElementId)).OrderByDescending(r => r.CreatedAt).Take(5).ToListAsync();
                latestReviews = revs.Select(r => new ReviewReceivedDto { Id = r.Id, Rating = r.Rating, Comment = r.Comment, ReviewerName = r.User.FullName, ElementName = r.Element.Name, CreatedAt = r.CreatedAt }).ToList();
            }
            else { latestReviews = new List<ReviewReceivedDto>(); }
            bookingsByDay = BuildBookingsByDay(receivedBookings.Select(b => b.CreatedAt).ToList(), 30);
            myServices = services.Select(s => new ServiceResponse
            {
                Id = s.Id, CategoryId = s.CategoryId, ProviderId = s.ProviderId,
                Name = s.Name, IsActive = s.IsActive, CreatedAt = s.CreatedAt, BookingUnit = s.BookingUnit,
                Elements = s.Elements.Select(e => new ElementResponse { Id = e.Id, ServiceId = e.ServiceId, Name = e.Name, IsActive = e.IsActive, Attributes = e.Attributes, OrderIndex = e.OrderIndex, Price = e.Price, BookingUnit = s.BookingUnit }).ToList()
            }).ToList();
        }

        if (user.Role == "Admin")
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalProviders = await _context.Users.CountAsync(u => u.Role == "Provider");
            var totalCustomers = await _context.Users.CountAsync(u => u.Role == "Customer");
            var totalServices = await _context.Services.CountAsync();
            var totalElements = await _context.Elements.CountAsync();
            var totalBookings = await _context.Bookings.CountAsync();
            var activeCategories = await _context.Categories.CountAsync(c => c.IsActive);
            var totalReviews = await _context.Reviews.CountAsync();
            platformStats = new PlatformStatsDto { TotalUsers = totalUsers, TotalProviders = totalProviders, TotalCustomers = totalCustomers, TotalServices = totalServices, TotalElements = totalElements, TotalBookings = totalBookings, ActiveCategories = activeCategories, TotalReviews = totalReviews };
            var lastUsers = await _context.Users.OrderByDescending(u => u.CreatedAt).Take(5).ToListAsync();
            recentUsers = lastUsers.Select(u => new RecentUserDto { Id = u.Id, FullName = u.FullName, Email = u.Email, Role = u.Role, CreatedAt = u.CreatedAt }).ToList();
            var allBookings = await _context.Bookings.Include(b => b.Element).ThenInclude(e => e.Service).ToListAsync();
            var bookingsByProvider = allBookings.GroupBy(b => b.Element.Service.ProviderId).OrderByDescending(g => g.Count()).Take(5).ToList();
            var providerIds = bookingsByProvider.Select(g => g.Key).ToList();
            var providers = await _context.Users.Where(u => providerIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);
            var servicesByProvider = await _context.Services.GroupBy(s => s.ProviderId).ToDictionaryAsync(g => g.Key, g => g.Count());
            var elems = await _context.Elements.Include(e => e.Service).ToListAsync();
            var elemsByProvider = elems.GroupBy(e => e.Service.ProviderId).ToDictionary(g => g.Key, g => g.Select(e => e.Id).ToList());
            var allReviews = await _context.Reviews.ToListAsync();
            topProviders = bookingsByProvider.Select(g => {
                var pid = g.Key;
                List<Guid> eIds = elemsByProvider.ContainsKey(pid) ? elemsByProvider[pid] : new List<Guid>();
                var provReviews = eIds.Count > 0 ? allReviews.Where(r => eIds.Contains(r.ElementId)).ToList() : new List<MyApp.Data.Entities.Review>();
                double avg = provReviews.Count > 0 ? Math.Round(provReviews.Average(r => r.Rating), 1) : 0;
                return new TopProviderDto { ProviderId = pid, ProviderName = providers.ContainsKey(pid) ? providers[pid] : "Unknown", BookingsReceived = g.Count(), AvgRating = avg, ServicesCount = servicesByProvider.ContainsKey(pid) ? servicesByProvider[pid] : 0 };
            }).ToList();
            platformBookingsByDay = BuildBookingsByDay(allBookings.Select(b => b.CreatedAt).ToList(), 30);
        }

        return Ok(new OverviewResponse
        {
            User = new MeResponse { Id = user.Id, Email = user.Email, FullName = user.FullName, Role = user.Role, PhoneNumber = user.PhoneNumber, IsActive = user.IsActive, CreatedAt = user.CreatedAt },
            Stats = stats,
            RecentBookings = recent,
            MyServices = myServices,
            UpcomingBookings = upcomingBookings,
            ProviderStats = providerStats,
            RecentIncomingBookings = recentIncoming,
            LatestReviewsReceived = latestReviews,
            BookingsByDay = bookingsByDay,
            PlatformStats = platformStats,
            RecentUsers = recentUsers,
            TopProviders = topProviders,
            PlatformBookingsByDay = platformBookingsByDay
        });
    }

    private static List<BookingsByDayDto> BuildBookingsByDay(List<DateTime> dates, int days)
    {
        var now = DateTime.UtcNow.Date;
        var map = new Dictionary<string, int>();
        for (int i = days - 1; i >= 0; i--) { var d = now.AddDays(-i); map[d.ToString("yyyy-MM-dd")] = 0; }
        foreach (var dt in dates) { var key = dt.Date.ToString("yyyy-MM-dd"); if (map.ContainsKey(key)) map[key]++; }
        return map.Select(kv => new BookingsByDayDto { Date = kv.Key, Count = kv.Value }).OrderBy(x => x.Date).ToList();
    }
}
