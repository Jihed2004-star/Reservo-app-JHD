namespace MyApp.Api.DTOs;

/// <summary>
/// Multipart payload for appending photos to an existing element gallery.
/// </summary>
public class ElementImageUploadRequest
{
    /// <summary>One or more images. The first file of an empty gallery becomes the cover.</summary>
    public List<IFormFile> Files { get; set; } = new();
}
