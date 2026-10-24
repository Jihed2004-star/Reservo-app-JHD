using MyApp.Data.Entities;

namespace MyApp.Api.Services;

/// <summary>
/// Single source of truth for turning a booking into money: the service's
/// <see cref="BookingUnit"/> decides how many billable units the window holds,
/// and the element's price is charged per unit.
/// </summary>
public static class RevenueCalculator
{
    /// <summary>
    /// Billable units in a booking window — hours for Hourly, whole days for
    /// Daily (never less than one) and calendar months for Monthly.
    /// </summary>
    public static decimal Units(BookingUnit unit, DateTime start, DateTime end)
    {
        var duration = end > start ? end - start : TimeSpan.Zero;

        return unit switch
        {
            BookingUnit.Hourly => Math.Round((decimal)duration.TotalHours, 1),
            BookingUnit.Daily => Math.Max(1m, Math.Round((decimal)duration.TotalDays, 0, MidpointRounding.AwayFromZero)),
            BookingUnit.Monthly => Math.Max(1m, (end.Year - start.Year) * 12 + end.Month - start.Month),
            _ => Math.Max(1m, Math.Round((decimal)duration.TotalDays, 0, MidpointRounding.AwayFromZero))
        };
    }

    /// <summary>Unit price × billable units for a booking that has its element and service loaded.</summary>
    public static decimal Amount(Booking booking) =>
        Units(
            booking.Element.Service.BookingUnit,
            booking.TimeRange.LowerBound,
            booking.TimeRange.UpperBound) * booking.Element.Price;
}
