namespace MyApp.Api.DTOs;

public class OverviewResponse
{
    public MeResponse User { get; set; } = null!;
    public OverviewStats Stats { get; set; } = null!;
    public List<BookingResponse> RecentBookings { get; set; } = new();
    public List<ServiceResponse> MyServices { get; set; } = new();
    public List<BookingResponse> UpcomingBookings { get; set; } = new();

    public ProviderStatsDto? ProviderStats { get; set; }
    public List<IncomingBookingDto>? RecentIncomingBookings { get; set; }
    public List<ReviewReceivedDto>? LatestReviewsReceived { get; set; }
    public List<BookingsByDayDto>? BookingsByDay { get; set; }

    public PlatformStatsDto? PlatformStats { get; set; }
    public List<RecentUserDto>? RecentUsers { get; set; }
    public List<TopProviderDto>? TopProviders { get; set; }
    public List<BookingsByDayDto>? PlatformBookingsByDay { get; set; }
}

public class OverviewStats
{
    public int TotalBookings { get; set; }
    public int UpcomingCount { get; set; }
    public int CompletedCount { get; set; }
    public int CancelledCount { get; set; }
    public int ServicesCount { get; set; }
    public int ElementsCount { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }
}

public class ProviderStatsDto
{
    public int BookingsReceived { get; set; }
    public double AvgRating { get; set; }
    public int ReviewCount { get; set; }
    public int ServicesCount { get; set; }
    public int ElementsCount { get; set; }
    public decimal Revenue { get; set; }
}

public class IncomingBookingDto
{
    public Guid Id { get; set; }
    public string ElementName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class ReviewReceivedDto
{
    public Guid Id { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public string ElementName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class BookingsByDayDto
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class PlatformStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalProviders { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalServices { get; set; }
    public int TotalElements { get; set; }
    public int TotalBookings { get; set; }
    public int ActiveCategories { get; set; }
    public int TotalReviews { get; set; }
}

public class RecentUserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class TopProviderDto
{
    public Guid ProviderId { get; set; }
    public string ProviderName { get; set; } = string.Empty;
    public int BookingsReceived { get; set; }
    public double AvgRating { get; set; }
    public int ServicesCount { get; set; }
}
