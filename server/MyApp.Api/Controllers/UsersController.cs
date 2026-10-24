using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyApp.Api.DTOs;
using MyApp.Data;

namespace MyApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private static readonly string[] ValidRoles = { "Customer", "Provider", "Admin" };

    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAll()
    {
        var users = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                Role = u.Role,
                PhoneNumber = u.PhoneNumber,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPatch("{id}/toggle-active")]
    public async Task<ActionResult<UserResponse>> ToggleActive(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null) return NotFound(new { message = "User not found." });
        var currentAdminId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")!.Value);
        if (user.Id == currentAdminId) return BadRequest(new { message = "You cannot deactivate your own account." });
        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            PhoneNumber = user.PhoneNumber,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpPatch("{id}/role")]
    public async Task<ActionResult<UserResponse>> UpdateRole(Guid id, UpdateRoleRequest request)
    {
        if (!ValidRoles.Contains(request.Role))
        {
            return BadRequest(new { message = $"Role must be one of: {string.Join(", ", ValidRoles)}." });
        }

        var user = await _context.Users.FindAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var currentAdminId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                ?? User.FindFirst("sub")!.Value);

        if (user.Id == currentAdminId && request.Role != "Admin")
        {
            return BadRequest(new { message = "You cannot demote your own account." });
        }

        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            PhoneNumber = user.PhoneNumber,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        });
    }
}