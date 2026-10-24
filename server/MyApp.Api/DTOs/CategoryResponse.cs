namespace MyApp.Api.DTOs;

public class CategoryResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Relative URL of the uploaded cover image, or null when none was uploaded.</summary>
    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
    public double? AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
}
