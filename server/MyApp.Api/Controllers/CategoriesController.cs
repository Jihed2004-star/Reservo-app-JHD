using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Api.Services;
using MyApp.Data;
using MyApp.Data.Entities;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public CategoriesController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> GetAll()
    {
        var categories = await _context.Categories
            .Where(c => c.IsActive)
            .Select(c => new CategoryResponse
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                CreatedAt = c.CreatedAt,
                IsActive = c.IsActive,
                AverageRating = _context.Reviews.Where(r => r.Element.Service.CategoryId == c.Id).Average(r => (double?)r.Rating),
                ReviewCount = _context.Reviews.Count(r => r.Element.Service.CategoryId == c.Id),
                MinPrice = _context.Elements.Where(e => e.Service.CategoryId == c.Id).Min(e => (decimal?)e.Price),
                MaxPrice = _context.Elements.Where(e => e.Service.CategoryId == c.Id).Max(e => (decimal?)e.Price)
            })
            .ToListAsync();

        return Ok(categories);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("all")]
    public async Task<ActionResult<List<CategoryResponse>>> GetAllIncludingInactive()
    {
        var categories = await _context.Categories
            .Select(c => new CategoryResponse
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                CreatedAt = c.CreatedAt,
                IsActive = c.IsActive,
                AverageRating = _context.Reviews.Where(r => r.Element.Service.CategoryId == c.Id).Average(r => (double?)r.Rating),
                ReviewCount = _context.Reviews.Count(r => r.Element.Service.CategoryId == c.Id),
                MinPrice = _context.Elements.Where(e => e.Service.CategoryId == c.Id).Min(e => (decimal?)e.Price),
                MaxPrice = _context.Elements.Where(e => e.Service.CategoryId == c.Id).Max(e => (decimal?)e.Price)
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryResponse>> GetById(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        var avg = await _context.Reviews.Where(r => r.Element.Service.CategoryId == id).AverageAsync(r => (double?)r.Rating);
        var count = await _context.Reviews.CountAsync(r => r.Element.Service.CategoryId == id);
        var minPrice = await _context.Elements.Where(e => e.Service.CategoryId == id).MinAsync(e => (decimal?)e.Price);
        var maxPrice = await _context.Elements.Where(e => e.Service.CategoryId == id).MaxAsync(e => (decimal?)e.Price);

        return Ok(new CategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            CreatedAt = category.CreatedAt,
            IsActive = category.IsActive,
            AverageRating = avg,
            ReviewCount = count,
            MinPrice = minPrice,
            MaxPrice = maxPrice
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    [Consumes("multipart/form-data")]
    public Task<ActionResult<CategoryResponse>> Create([FromForm] CategoryFormRequest request)
        => CreateCoreAsync(request.Name, request.Description, request.Image);

    /// <summary>
    /// JSON fallback for scripted clients (see scripts/e2e_remove_intervals.py).
    /// Same route, disambiguated by the request content type.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    [Consumes("application/json")]
    // Two actions on one route make the OpenAPI document ambiguous and
    // Swashbuckle answers 500 for /swagger/v1/swagger.json, so the JSON
    // fallback stays out of the docs while remaining routable.
    [ApiExplorerSettings(IgnoreApi = true)]
    public Task<ActionResult<CategoryResponse>> CreateJson(CategoryRequest request)
        => CreateCoreAsync(request.Name, request.Description, null);

    private async Task<ActionResult<CategoryResponse>> CreateCoreAsync(
        string name,
        string? description,
        IFormFile? image)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Name is required." });
        }

        string? imageUrl = null;
        if (image is not null)
        {
            try
            {
                imageUrl = (await _fileStorage.SaveAsync(image, StorageFolders.Categories)).Url;
            }
            catch (FileStorageException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        var category = new Category
        {
            Name = name.Trim(),
            Description = description,
            ImageUrl = imageUrl
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        var response = new CategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            CreatedAt = category.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, response);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public Task<ActionResult<CategoryResponse>> Update(Guid id, [FromForm] CategoryFormRequest request)
        => UpdateCoreAsync(id, request.Name, request.Description, request.Image, request.RemoveImage);

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    [Consumes("application/json")]
    // Hidden from Swagger for the same reason as CreateJson above.
    [ApiExplorerSettings(IgnoreApi = true)]
    public Task<ActionResult<CategoryResponse>> UpdateJson(Guid id, CategoryRequest request)
        => UpdateCoreAsync(id, request.Name, request.Description, null, false);

    private async Task<ActionResult<CategoryResponse>> UpdateCoreAsync(
        Guid id,
        string name,
        string? description,
        IFormFile? image,
        bool removeImage)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Name is required." });
        }

        var previousImageUrl = category.ImageUrl;
        string? uploadedImageUrl = null;

        if (image is not null)
        {
            try
            {
                uploadedImageUrl = (await _fileStorage.SaveAsync(image, StorageFolders.Categories)).Url;
            }
            catch (FileStorageException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        category.Name = name.Trim();
        category.Description = description;

        if (uploadedImageUrl is not null)
        {
            category.ImageUrl = uploadedImageUrl;
        }
        else if (removeImage)
        {
            category.ImageUrl = null;
        }

        await _context.SaveChangesAsync();

        // Only drop the old file once the new URL is safely persisted.
        if (previousImageUrl is not null && previousImageUrl != category.ImageUrl)
        {
            await _fileStorage.DeleteAsync(previousImageUrl);
        }

        return Ok(new CategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            CreatedAt = category.CreatedAt,
            IsActive = category.IsActive
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<CategoryResponse>> ToggleActive(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        category.IsActive = !category.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new CategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ImageUrl = category.ImageUrl,
            CreatedAt = category.CreatedAt,
            IsActive = category.IsActive
        });
    }
    
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        _context.Categories.Remove(category);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsForeignKeyViolation(ex))
        {
            return Conflict(new { message = "Cannot delete this category while services reference it." });
        }

        await _fileStorage.DeleteAsync(category.ImageUrl);

        return NoContent();
    }

    private static bool IsForeignKeyViolation(DbUpdateException ex)
    {
        return ex.InnerException is Npgsql.PostgresException pgEx && (pgEx.SqlState == "23503" || pgEx.SqlState == "23001");
    }
}