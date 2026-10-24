namespace MyApp.Api.DTOs;

public class RemoveAvailabilityIntervalResponse
{
    /// <summary>Slots that were fully covered by the removed interval.</summary>
    public int RemovedSlots { get; set; }

    /// <summary>Slots that were only partially covered and therefore trimmed or split.</summary>
    public int TrimmedSlots { get; set; }

    /// <summary>New availability rows created from the parts of a split slot that stayed open.</summary>
    public int CreatedSlots { get; set; }
}
