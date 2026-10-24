using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Api.Mappings;
using MyApp.Api.Services;
using MyApp.Data;
using MyApp.Data.Entities;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ElementsController : ControllerBase
{
    /// <summary>Upper bound on a single element's gallery.</summary>
    private const int MaxImagesPerElement = 8;

    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public ElementsController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public async Task<ActionResult<List<ElementResponse>>> GetAll([FromQuery] Guid? serviceId)
    {
        var query = _context.Elements
            .Include(e => e.Service)
            .Include(e => e.Images)
            .Where(e => e.IsActive && e.Service.IsActive)
            .AsQueryable();

        if (serviceId.HasValue)
        {
            query = query.Where(e => e.ServiceId == serviceId.Value);
        }

        var elementEntities = await query
            .OrderBy(e => e.OrderIndex)
            .ToListAsync();

        var elements = new List<ElementResponse>();
        foreach (var e in elementEntities)
        {
            elements.Add(await MapToResponseAsync(e));
        }

        return Ok(elements);
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<ElementResponse>> GetById(Guid id)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        var isInactive = !element.IsActive || !element.Service.IsActive;

        if (isInactive && !IsOwnerOrAdminIfAuthenticated(element.Service.ProviderId))
        {
            return NotFound(new { message = "Element not found." });
        }

        return Ok(await MapToResponseAsync(element));
    }
    [Authorize(Roles = "Provider,Admin")]
    [HttpPost]
    [Consumes("multipart/form-data")]
    public Task<ActionResult<ElementResponse>> Create([FromForm] ElementFormRequest request)
        => CreateCoreAsync(
            request.ServiceId,
            request.Name,
            request.OrderIndex,
            request.Price,
            ParseAttributes(request.AttributesJson),
            request.Images);

    [Authorize(Roles = "Provider,Admin")]
    [HttpPost]
    [Consumes("application/json")]
    // Hidden from Swagger: sharing a route with the multipart Create action
    // breaks the generated OpenAPI document (Swashbuckle returns 500).
    [ApiExplorerSettings(IgnoreApi = true)]
    public Task<ActionResult<ElementResponse>> CreateJson(ElementRequest request)
        => CreateCoreAsync(
            request.ServiceId,
            request.Name,
            request.OrderIndex,
            request.Price,
            request.Attributes ?? new Dictionary<string, string>(),
            new List<IFormFile>());

    private async Task<ActionResult<ElementResponse>> CreateCoreAsync(
        Guid serviceId,
        string name,
        int orderIndex,
        decimal price,
        Dictionary<string, string> attributes,
        List<IFormFile> images)
    {
        var service = await _context.Services.FindAsync(serviceId);
        if (service is null)
        {
            return BadRequest(new { message = "ServiceId does not reference an existing service." });
        }

        if (!IsOwnerOrAdmin(service.ProviderId))
        {
            return Forbid();
        }

        if (images.Count > MaxImagesPerElement)
        {
            return BadRequest(new { message = $"An element can have at most {MaxImagesPerElement} photos." });
        }

        List<StoredFile> storedFiles;
        try
        {
            storedFiles = images.Count == 0
                ? new List<StoredFile>()
                : await _fileStorage.SaveManyAsync(images, StorageFolders.Elements);
        }
        catch (FileStorageException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var element = new Element
        {
            ServiceId = serviceId,
            Name = name,
            OrderIndex = orderIndex,
            Price = price,
            Attributes = attributes
        };

        for (var index = 0; index < storedFiles.Count; index++)
        {
            element.Images.Add(new ElementImage
            {
                ElementId = element.Id,
                Url = storedFiles[index].Url,
                // The first upload doubles as the cover so a new element is
                // never created without one.
                IsPrimary = index == 0,
                DisplayOrder = index
            });
        }

        _context.Elements.Add(element);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch
        {
            // The rows were never written, so the freshly uploaded files would
            // otherwise be orphaned on disk.
            await _fileStorage.DeleteManyAsync(storedFiles.Select(f => f.Url));
            throw;
        }

        await _context.Entry(element).Reference(e => e.Service).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = element.Id }, await MapToResponseAsync(element));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<ElementResponse>> Update(Guid id, ElementRequest request)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        element.Name = request.Name;
        element.OrderIndex = request.OrderIndex;
        element.Price = request.Price;
        element.Attributes = request.Attributes;

        await _context.SaveChangesAsync();

        return Ok(await MapToResponseAsync(element));
    }




    [Authorize(Roles = "Provider,Admin")]
    [HttpPost("{id}/images")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<List<ElementImageResponse>>> AddImages(
        Guid id,
        [FromForm] ElementImageUploadRequest request)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        var files = request.Files ?? new List<IFormFile>();
        if (files.Count == 0)
        {
            return BadRequest(new { message = "No files were uploaded." });
        }

        if (element.Images.Count + files.Count > MaxImagesPerElement)
        {
            return BadRequest(new { message = $"An element can have at most {MaxImagesPerElement} photos." });
        }

        List<StoredFile> storedFiles;
        try
        {
            storedFiles = await _fileStorage.SaveManyAsync(files, StorageFolders.Elements);
        }
        catch (FileStorageException ex)
        {
            return BadRequest(new { message = ex.Message });
        }

        var nextOrder = element.Images.Count == 0 ? 0 : element.Images.Max(i => i.DisplayOrder) + 1;
        var hasPrimary = element.Images.Any(i => i.IsPrimary);

        for (var index = 0; index < storedFiles.Count; index++)
        {
            var image = new ElementImage
            {
                ElementId = element.Id,
                Url = storedFiles[index].Url,
                // Only claim the cover when the gallery does not have one yet.
                IsPrimary = !hasPrimary && index == 0,
                DisplayOrder = nextOrder + index
            };

            // The Id is assigned up front, so an entity discovered through the
            // navigation would be treated as an existing row; add it explicitly.
            // EF then fixes up Element.Images on its own, so do not push it twice.
            _context.ElementImages.Add(image);
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch
        {
            await _fileStorage.DeleteManyAsync(storedFiles.Select(f => f.Url));
            throw;
        }

        return Ok(element.Images.ToImageResponses());
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpDelete("{id}/images/{imageId}")]
    public async Task<IActionResult> DeleteImage(Guid id, Guid imageId)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        var image = element.Images.FirstOrDefault(i => i.Id == imageId);
        if (image is null)
        {
            return NotFound(new { message = "Image not found." });
        }

        _context.ElementImages.Remove(image);

        // Never leave a gallery without a cover: promote the next photo in line.
        if (image.IsPrimary)
        {
            var next = element.Images
                .Where(i => i.Id != imageId)
                .OrderBy(i => i.DisplayOrder)
                .FirstOrDefault();

            if (next is not null)
            {
                next.IsPrimary = true;
            }
        }

        await _context.SaveChangesAsync();
        await _fileStorage.DeleteAsync(image.Url);

        return NoContent();
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPatch("{id}/images/{imageId}/primary")]
    public async Task<ActionResult<List<ElementImageResponse>>> SetPrimaryImage(Guid id, Guid imageId)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        if (element.Images.All(i => i.Id != imageId))
        {
            return NotFound(new { message = "Image not found." });
        }

        foreach (var image in element.Images)
        {
            image.IsPrimary = image.Id == imageId;
        }

        await _context.SaveChangesAsync();

        return Ok(element.Images.ToImageResponses());
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<ElementResponse>> ToggleActive(Guid id)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        element.IsActive = !element.IsActive;
        await _context.SaveChangesAsync();

        return Ok(await MapToResponseAsync(element));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var element = await _context.Elements
            .Include(e => e.Service)
            .Include(e => e.Images)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (element is null)
        {
            return NotFound(new { message = "Element not found." });
        }

        if (!IsOwnerOrAdmin(element.Service.ProviderId))
        {
            return Forbid();
        }

        var imageUrls = element.Images.Select(i => i.Url).ToList();

        _context.Elements.Remove(element);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsForeignKeyViolation(ex))
        {
            return Conflict(new { message = "Cannot delete this element while it has booking history." });
        }

        // Files are removed only after the row is gone, so a failed delete never
        // leaves a record pointing at a missing image.
        await _fileStorage.DeleteManyAsync(imageUrls);

        return NoContent();
    }

    private static bool IsForeignKeyViolation(DbUpdateException ex)
    {
        // Postgres SQLSTATE 23503 = foreign_key_violation
        return ex.InnerException is Npgsql.PostgresException pgEx  && (pgEx.SqlState == "23503" || pgEx.SqlState == "23001");
    }

    

    private bool IsOwnerOrAdmin(Guid ownerProviderId)
    {
        if (User.IsInRole("Admin"))
        {
            return true;
        }

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                        ?? User.FindFirst("sub")!.Value);

        return currentUserId == ownerProviderId;
    }
  private bool IsOwnerOrAdminIfAuthenticated(Guid ownerProviderId)
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return false;
        }

        if (User.IsInRole("Admin"))
        {
            return true;
        }

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                        ?? User.FindFirst("sub")!.Value);

        return currentUserId == ownerProviderId;
    }
    private async Task<ElementResponse> MapToResponseAsync(Element e)
    {
        var ratings = await _context.Reviews
            .Where(r => r.ElementId == e.Id)
            .Select(r => r.Rating)
            .ToListAsync();

        return new ElementResponse
        {
            Id = e.Id,
            ServiceId = e.ServiceId,
            Name = e.Name,
            OrderIndex = e.OrderIndex,
            Price = e.Price,
            Attributes = e.Attributes,
            BookingUnit = e.Service.BookingUnit,
            IsActive = e.IsActive,
            AverageRating = ratings.Count > 0 ? Math.Round(ratings.Average(), 1) : 0,
            ReviewCount = ratings.Count,
            Images = e.Images.ToImageResponses(),
            PrimaryImageUrl = e.Images.PrimaryImageUrl()
        };
    }

    /// <summary>
    /// Parses the JSON object sent by multipart clients. Empty or malformed input
    /// yields an empty dictionary instead of failing the whole request.
    /// </summary>
    private static Dictionary<string, string> ParseAttributes(string? attributesJson)
    {
        if (string.IsNullOrWhiteSpace(attributesJson))
        {
            return new Dictionary<string, string>();
        }

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(attributesJson)
                   ?? new Dictionary<string, string>();
        }
        catch (JsonException)
        {
            return new Dictionary<string, string>();
        }
    }
}
