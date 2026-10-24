namespace MyApp.Data.Entities;

/// <summary>
/// One uploaded photo belonging to an Element. An element can hold several
/// images; exactly one of them is flagged <see cref="IsPrimary"/> and is used as
/// the cover everywhere the element is listed. The file itself lives on disk
/// under wwwroot/uploads/elements and <see cref="Url"/> stores the relative path.
/// </summary>
public class ElementImage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ElementId { get; set; }

    public Element Element { get; set; } = null!;

    /// <summary>Relative URL, e.g. "/uploads/elements/8f3c....webp".</summary>
    public string Url { get; set; } = string.Empty;

    public bool IsPrimary { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
