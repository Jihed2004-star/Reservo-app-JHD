namespace MyApp.Api.DTOs;

public class AvailabilityIntervalDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}

public class RemoveAvailabilityIntervalsRequest
{
    public Guid ElementId { get; set; }

    /// <summary>
    /// One or more time ranges to close. They are subtracted from the element's
    /// availability in a single pass so adjacent selections can't race each other.
    /// </summary>
    public List<AvailabilityIntervalDto> Intervals { get; set; } = new();
}
