namespace MyApp.Api.DTOs;

/// <summary>
/// Multipart form payload for creating an element together with its photos.
/// Attributes travel as a JSON string because form binding of nested
/// dictionaries is fragile across clients.
/// </summary>
public class ElementFormRequest
{
    public Guid ServiceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int OrderIndex { get; set; }
    public decimal Price { get; set; }

    /// <summary>JSON object, e.g. {"color":"Red"}. Ignored when empty/invalid.</summary>
    public string? AttributesJson { get; set; }

    /// <summary>Optional gallery. The first file becomes the primary cover.</summary>
    public List<IFormFile> Images { get; set; } = new();
}
