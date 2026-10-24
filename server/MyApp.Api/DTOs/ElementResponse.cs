namespace MyApp.Api.DTOs;

using MyApp.Data.Entities;

public class ElementResponse
{
    public Guid Id { get; set; }
    public Guid ServiceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public int OrderIndex { get; set; }
    public decimal Price { get; set; }
    public Dictionary<string, string> Attributes { get; set; } = new();
    public BookingUnit BookingUnit { get; set; }
    public bool IsActive { get; set; }
    public double AverageRating { get; set; }
    public int ReviewCount { get; set; }

    /// <summary>Uploaded photos, primary first then by display order.</summary>
    public List<ElementImageResponse> Images { get; set; } = new();

    /// <summary>Convenience shortcut for the cover URL (null when the gallery is empty).</summary>
    public string? PrimaryImageUrl { get; set; }
}