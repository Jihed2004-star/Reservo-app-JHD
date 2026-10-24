namespace MyApp.Api.DTOs;

using MyApp.Data.Entities;

public class ServiceResponse
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public Guid ProviderId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Relative URL of the uploaded cover image, or null when none was uploaded.</summary>
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public BookingUnit BookingUnit { get; set; }
    public List<ElementResponse> Elements { get; set; } = new();
}