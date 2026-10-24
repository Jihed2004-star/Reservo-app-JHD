namespace MyApp.Api.DTOs;

/// <summary>
/// Everything the Revenue &amp; Sales Analytics dashboard needs in one round trip:
/// the headline KPIs, two time series, a per-element breakdown and the most
/// recent transactions.
/// </summary>
public class ProviderRevenueResponse
{
    public RevenueFinancialsDto Financials { get; set; } = new();
    public List<DailyRevenueDto> DailyRevenue { get; set; } = new();
    public List<MonthlyRevenueDto> MonthlyRevenue { get; set; } = new();
    public List<ElementRevenueDto> ElementBreakdown { get; set; } = new();
    public List<RevenueTransactionDto> Transactions { get; set; } = new();
}

public class RevenueFinancialsDto
{
    /// <summary>Sum of (unit price × units) over bookings whose window has ended.</summary>
    public decimal TotalEarned { get; set; }

    /// <summary>Same formula, but for bookings that are still Confirmed and not yet finished.</summary>
    public decimal UpcomingRevenue { get; set; }

    public decimal ThisMonthRevenue { get; set; }
    public decimal LastMonthRevenue { get; set; }

    /// <summary>Percentage change vs. the previous calendar month. 0 when both are empty.</summary>
    public double MonthOverMonthGrowth { get; set; }

    public decimal AverageBookingValue { get; set; }
    public decimal CancelledRevenue { get; set; }

    public int CompletedBookingsCount { get; set; }
    public int UpcomingBookingsCount { get; set; }
    public int CancelledBookingsCount { get; set; }
}

public class DailyRevenueDto
{
    /// <summary>"yyyy-MM-dd" (UTC), always present even when the day earned nothing.</summary>
    public string Date { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int BookingsCount { get; set; }
}

public class MonthlyRevenueDto
{
    /// <summary>"MMM yyyy", e.g. "Oct 2026".</summary>
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int BookingsCount { get; set; }
}

public class ElementRevenueDto
{
    public Guid ElementId { get; set; }
    public string ElementName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string BookingUnit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int CompletedBookingsCount { get; set; }
    public decimal TotalUnitsSold { get; set; }
    public decimal TotalRevenue { get; set; }

    /// <summary>Share of <see cref="RevenueFinancialsDto.TotalEarned"/>, 0–100, one decimal.</summary>
    public double PercentageOfTotal { get; set; }
}

public class RevenueTransactionDto
{
    public Guid Id { get; set; }

    /// <summary>Readable short code derived from the booking id — bookings have no human-facing number of their own.</summary>
    public string BookingCode { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string ElementName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string DurationFormatted { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
