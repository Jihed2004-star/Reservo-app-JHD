using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Api.Mappings;
using MyApp.Api.Services;
using MyApp.Data;
using MyApp.Data.Entities;
using System.Security.Claims;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public ServicesController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public async Task<ActionResult<List<ServiceResponse>>> GetAll([FromQuery] Guid? categoryId)
    {
        var query = _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
                .ThenInclude(e => e.Images)
            .AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(s => s.CategoryId == categoryId.Value);
            query = query.Where(s => s.IsActive);
        }

        var services = await query.Select(s => MapToResponse(s)).ToListAsync();

        return Ok(services);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ServiceResponse>> GetById(Guid id)
    {
        var service = await _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
                .ThenInclude(e => e.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }

        return Ok(MapToResponse(service));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpGet("mine")]
    public async Task<ActionResult<List<ServiceResponse>>> GetMine()
    {
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")!.Value);

        var query = _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
                .ThenInclude(e => e.Images)
            .AsQueryable();

        if (!User.IsInRole("Admin"))
        {
            query = query.Where(s => s.ProviderId == currentUserId);
        }

        var services = await query.Select(s => MapToResponse(s)).ToListAsync();

        return Ok(services);
    }


    [Authorize(Roles = "Provider,Admin")]
    [HttpPost]
    [Consumes("multipart/form-data")]
    public Task<ActionResult<ServiceResponse>> Create([FromForm] ServiceFormRequest request)
        => CreateCoreAsync(request.CategoryId, request.Name, request.Description, request.IsActive, request.BookingUnit, request.Image);

    /// <summary>
    /// JSON fallback for scripted clients (see scripts/e2e_remove_intervals.py).
    /// Same route, disambiguated by the request content type.
    /// </summary>
    [Authorize(Roles = "Provider,Admin")]
    [HttpPost]
    [Consumes("application/json")]
    // Hidden from Swagger: sharing a route with the multipart Create action
    // breaks the generated OpenAPI document (Swashbuckle returns 500).
    [ApiExplorerSettings(IgnoreApi = true)]
    public Task<ActionResult<ServiceResponse>> CreateJson(ServiceRequest request)
        => CreateCoreAsync(request.CategoryId, request.Name, request.Description, request.IsActive, request.BookingUnit, null);

    private async Task<ActionResult<ServiceResponse>> CreateCoreAsync(
        Guid categoryId,
        string name,
        string? description,
        bool isActive,
        BookingUnit bookingUnit,
        IFormFile? image)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == categoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "CategoryId does not reference an existing category." });
        }

        var providerId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? User.FindFirst("sub")!.Value);

        string? imageUrl = null;
        if (image is not null)
        {
            try
            {
                imageUrl = (await _fileStorage.SaveAsync(image, StorageFolders.Services)).Url;
            }
            catch (FileStorageException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        var service = new Service
        {
            CategoryId = categoryId,
            ProviderId = providerId,
            Name = name,
            Description = description,
            ImageUrl = imageUrl,
            IsActive = isActive,
            BookingUnit = bookingUnit
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        // Reload with Category included so the response has CategoryName populated
        await _context.Entry(service).Reference(s => s.Category).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = service.Id }, MapToResponse(service));
    }

    [Authorize(Roles = "Provider,Admin")]
    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public Task<ActionResult<ServiceResponse>> Update(Guid id, [FromForm] ServiceFormRequest request)
        => UpdateCoreAsync(
            id,
            request.CategoryId,
            request.Name,
            request.Description,
            request.IsActive,
            request.BookingUnit,
            request.Image,
            request.RemoveImage);

    [Authorize(Roles = "Provider,Admin")]
    [HttpPut("{id}")]
    [Consumes("application/json")]
    // Hidden from Swagger for the same reason as CreateJson above.
    [ApiExplorerSettings(IgnoreApi = true)]
    public Task<ActionResult<ServiceResponse>> UpdateJson(Guid id, ServiceRequest request)
        => UpdateCoreAsync(
            id,
            request.CategoryId,
            request.Name,
            request.Description,
            request.IsActive,
            request.BookingUnit,
            null,
            false);

    private async Task<ActionResult<ServiceResponse>> UpdateCoreAsync(
        Guid id,
        Guid categoryId,
        string name,
        string? description,
        bool isActive,
        BookingUnit bookingUnit,
        IFormFile? image,
        bool removeImage)
    {
        var service = await _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
                .ThenInclude(e => e.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")!.Value);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && service.ProviderId != currentUserId)
        {
            return Forbid();
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == categoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "CategoryId does not reference an existing category." });
        }

        if (bookingUnit != service.BookingUnit)
        {
            bool hasExistingData = await _context.Elements
                .Where(e => e.ServiceId == service.Id)
                .AnyAsync(e =>
                    _context.Availabilities.Any(a => a.ElementId == e.Id) ||
                    _context.Bookings.Any(b => b.ElementId == e.Id));

            if (hasExistingData)
            {
                return Conflict(new { message = "Cannot change booking granularity while existing availability or bookings are present. Clear them first." });
            }
        }

        var previousImageUrl = service.ImageUrl;
        string? uploadedImageUrl = null;

        if (image is not null)
        {
            try
            {
                uploadedImageUrl = (await _fileStorage.SaveAsync(image, StorageFolders.Services)).Url;
            }
            catch (FileStorageException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        service.CategoryId = categoryId;
        service.Name = name;
        service.Description = description;
        service.IsActive = isActive;
        service.BookingUnit = bookingUnit;

        if (uploadedImageUrl is not null)
        {
            service.ImageUrl = uploadedImageUrl;
        }
        else if (removeImage)
        {
            service.ImageUrl = null;
        }

        await _context.SaveChangesAsync();

        // Only drop the old file once the new URL is safely persisted.
        if (previousImageUrl is not null && previousImageUrl != service.ImageUrl)
        {
            await _fileStorage.DeleteAsync(previousImageUrl);
        }

        return Ok(MapToResponse(service));
    }

    [Authorize(Roles = "Provider,Admin")] 
    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<ServiceResponse>> ToggleActive(Guid id)
    {
        var service = await _context.Services
            .Include(s => s.Category)
            .Include(s => s.Elements)
                .ThenInclude(e => e.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }

        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")!.Value);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && service.ProviderId != currentUserId)
        {
            return Forbid();
        }

        service.IsActive = !service.IsActive;
        await _context.SaveChangesAsync();

        return Ok(MapToResponse(service));
    }



    [Authorize(Roles = "Provider,Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var service = await _context.Services
            .Include(s => s.Elements)
                .ThenInclude(e => e.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service is null)
        {
            return NotFound(new { message = "Service not found." });
        }
        var currentUserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                        ?? User.FindFirst("sub")!.Value);
        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && service.ProviderId != currentUserId)
        {
            return Forbid();
        }
        // Collect the files before the rows disappear so the disk does not fill
        // up with covers/galleries nobody can reach any more.
        var imageUrls = new List<string?>();
        if (!string.IsNullOrEmpty(service.ImageUrl))
        {
            imageUrls.Add(service.ImageUrl);
        }
        imageUrls.AddRange(service.Elements.SelectMany(e => e.Images.Select(i => (string?)i.Url)));

        _context.Services.Remove(service);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsForeignKeyViolation(ex))
        {
            return Conflict(new { message = "Cannot delete this service while its elements have booking history. Remove or archive bookings first." });
        }

        await _fileStorage.DeleteManyAsync(imageUrls);

        return NoContent();
    }

    private static bool IsForeignKeyViolation(DbUpdateException ex)
    {
        // Postgres SQLSTATE 23503 = foreign_key_violation
        return ex.InnerException is Npgsql.PostgresException pgEx && (pgEx.SqlState == "23503" || pgEx.SqlState == "23001");
    }
    


    private static ServiceResponse MapToResponse(Service s) => new()
    {
        Id = s.Id,
        CategoryId = s.CategoryId,
        ProviderId = s.ProviderId,
        CategoryName = s.Category.Name,
        Name = s.Name,
        Description = s.Description,
        ImageUrl = s.ImageUrl,
        IsActive = s.IsActive,
        CreatedAt = s.CreatedAt,
        BookingUnit = s.BookingUnit,
        Elements = s.Elements.Select(e => new ElementResponse
        {
            Id = e.Id,
            ServiceId = e.ServiceId,
            Name = e.Name,
            OrderIndex = e.OrderIndex,
            Price = e.Price,
            Attributes = e.Attributes,
            BookingUnit = s.BookingUnit,
            IsActive = e.IsActive,
            Images = e.Images.ToImageResponses(),
            PrimaryImageUrl = e.Images.PrimaryImageUrl()
        }).ToList()
    };
}
