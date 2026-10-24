namespace MyApp.Api.DTOs;

public class ElementImageResponse
{
    public Guid Id { get; set; }
    public Guid ElementId { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}
