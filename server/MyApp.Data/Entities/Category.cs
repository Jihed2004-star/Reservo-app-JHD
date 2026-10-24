namespace MyApp.Data.Entities;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>
    /// Relative URL of the uploaded cover image ("/uploads/categories/xxx.webp").
    /// Null means no upload yet — the UI falls back to a curated stock photo.
    /// </summary>
    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}