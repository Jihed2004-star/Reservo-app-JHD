namespace MyApp.Data.Entities;

public class Service
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Foreign key — the raw column that stores which Category this belongs to
    public Guid CategoryId { get; set; }

    // Navigation property — lets you write service.Category.Name instead of
    // doing a separate lookup. EF Core fills this in automatically when you ask for it.
    public Category Category { get; set; } = null!;

    // The Provider (User) who owns this agency/offering
    public Guid ProviderId { get; set; }

    public User Provider { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>
    /// Relative URL of the uploaded cover image ("/uploads/services/xxx.webp").
    /// Null means no upload yet — the UI falls back to a curated stock photo.
    /// </summary>
    public string? ImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    // Controls how the frontend calendar presents booking (hourly slots vs day/month ranges)
    public BookingUnit BookingUnit { get; set; } = BookingUnit.Hourly;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property for the "many" side — one Service can have many Elements
    public List<Element> Elements { get; set; } = new();
}