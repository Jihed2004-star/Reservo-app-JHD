using MyApp.Api.DTOs;
using MyApp.Data.Entities;

namespace MyApp.Api.Mappings;

/// <summary>
/// Shared shape for element galleries so the element, service and category
/// endpoints all return images in the same order (cover first, then display order).
/// </summary>
public static class ImageMapping
{
    public static List<ElementImageResponse> ToImageResponses(this IEnumerable<ElementImage> images) =>
        images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.DisplayOrder)
            .Select(i => new ElementImageResponse
            {
                Id = i.Id,
                ElementId = i.ElementId,
                Url = i.Url,
                IsPrimary = i.IsPrimary,
                DisplayOrder = i.DisplayOrder,
                CreatedAt = i.CreatedAt
            })
            .ToList();

    /// <summary>Cover URL, falling back to the first image when no primary is flagged.</summary>
    public static string? PrimaryImageUrl(this IEnumerable<ElementImage> images) =>
        images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.DisplayOrder)
            .Select(i => i.Url)
            .FirstOrDefault();
}
