namespace MyApp.Data.Entities;

public class Element
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Foreign key + navigation property, same pattern as Service -> Category
    public Guid ServiceId { get; set; }

    public Service Service { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public int OrderIndex { get; set; }

    public decimal Price { get; set; }
    

    // Flexible schema-less key/value data, varies per Category/Service type
    // (e.g. { "color": "Red", "seats": "5" } for a car, { "specialty": "..." } for a stylist)
    public Dictionary<string, string> Attributes { get; set; } = new();
    public bool IsActive { get; set; } = true;

    /// <summary>Uploaded photos. At most one is primary; the rest form the gallery.</summary>
    public List<ElementImage> Images { get; set; } = new();
}