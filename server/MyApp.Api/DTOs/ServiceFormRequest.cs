namespace MyApp.Api.DTOs;

using MyApp.Data.Entities;

/// <summary>
/// Multipart form payload for creating/updating a service, including its cover
/// image. <see cref="ServiceRequest"/> remains for JSON-only clients.
/// </summary>
public class ServiceFormRequest
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public BookingUnit BookingUnit { get; set; } = BookingUnit.Hourly;

    /// <summary>New cover image. When present it replaces (and deletes) the old file.</summary>
    public IFormFile? Image { get; set; }

    /// <summary>Clears the current cover image without uploading a new one.</summary>
    public bool RemoveImage { get; set; }
}
