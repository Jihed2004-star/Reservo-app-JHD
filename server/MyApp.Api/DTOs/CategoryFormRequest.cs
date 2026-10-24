namespace MyApp.Api.DTOs;

/// <summary>
/// Multipart form payload for creating/updating a category. The JSON-only
/// <see cref="CategoryRequest"/> stays available for scripted clients that do
/// not upload a cover image.
/// </summary>
public class CategoryFormRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>New cover image. When present it replaces (and deletes) the old file.</summary>
    public IFormFile? Image { get; set; }

    /// <summary>Clears the current cover image without uploading a new one.</summary>
    public bool RemoveImage { get; set; }
}
