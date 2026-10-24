using Microsoft.EntityFrameworkCore;
using MyApp.Data;
using MyApp.Data.Entities;

namespace MyApp.Api.Services;

/// <summary>
/// Creates the initial administrator account from configuration so a freshly
/// migrated database (a new Docker volume, for instance) is usable without any
/// manual SQL. Idempotent: it runs on every start and only acts when needed.
/// </summary>
public static class AdminSeeder
{
    public const string DefaultFullName = "Administrator";

    public static async Task SeedAsync(
        AppDbContext context,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        // Configured through Seed__Admin__Email / Seed__Admin__Password (or the
        // Seed:Admin section). Leaving them blank keeps seeding opt-in.
        var email = configuration["Seed:Admin:Email"]?.Trim();
        var password = configuration["Seed:Admin:Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogInformation(
                "Admin seeding skipped: Seed:Admin:Email / Seed:Admin:Password are not set.");
            return;
        }

        var fullName = configuration["Seed:Admin:FullName"]?.Trim();
        if (string.IsNullOrWhiteSpace(fullName))
        {
            fullName = DefaultFullName;
        }

        // Emails are stored as typed by registration, so compare case-insensitively.
        var existing = await context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower(), cancellationToken);

        if (existing is not null)
        {
            // Keep the account usable if it was demoted or disabled by hand.
            if (existing.Role != "Admin" || !existing.IsActive)
            {
                existing.Role = "Admin";
                existing.IsActive = true;
                existing.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync(cancellationToken);

                logger.LogInformation(
                    "Admin seeding: restored the Admin role on {Email}.", existing.Email);
            }
            else
            {
                logger.LogInformation(
                    "Admin seeding: {Email} already exists, nothing to do.", existing.Email);
            }

            return;
        }

        context.Users.Add(new User
        {
            Email = email,
            // Same hasher as AuthController, otherwise login would never verify.
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            FullName = fullName,
            Role = "Admin",
            IsActive = true
        });

        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Admin seeding: created the administrator {Email}.", email);
    }
}
