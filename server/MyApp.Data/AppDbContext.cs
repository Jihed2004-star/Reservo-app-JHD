using Microsoft.EntityFrameworkCore;
using MyApp.Data.Entities;
using System.Text.Json;

namespace MyApp.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }


    public DbSet<Availability> Availabilities => Set<Availability>();    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Element> Elements => Set<Element>();
    public DbSet<ElementImage> ElementImages => Set<ElementImage>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Booking)
            .WithMany()
            .HasForeignKey(r => r.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.Element)
            .WithMany()
            .HasForeignKey(r => r.ElementId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Review>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // One review per booking — enforced at the database level
        modelBuilder.Entity<Review>()
            .HasIndex(r => r.BookingId)
            .IsUnique();
        
        

        modelBuilder.Entity<Service>()
            .Property(s => s.BookingUnit)
            .HasConversion<string>(); 
        
        modelBuilder.Entity<Category>()
            .Property(c => c.IsActive)
            .HasDefaultValue(true);

            
        modelBuilder.Entity<Availability>()
            .HasOne(a => a.Element)
            .WithMany()
            .HasForeignKey(a => a.ElementId)
            .OnDelete(DeleteBehavior.Cascade);
            
        modelBuilder.Entity<Element>()
            .Property(e => e.Attributes)
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>()
    );
      modelBuilder.Entity<Element>()
              .Property(e => e.IsActive)
              .HasDefaultValue(true);
              
        modelBuilder.Entity<Service>()
            .HasOne(s => s.Provider)
            .WithMany()
            .HasForeignKey(s => s.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);
          
        // Enforce uniqueness at the database level, not just in app code
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Service>()
            .HasOne(s => s.Category)
            .WithMany()
            .HasForeignKey(s => s.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Element>()
            .HasOne(e => e.Service)
            .WithMany(s => s.Elements)
            .HasForeignKey(e => e.ServiceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ElementImage>()
            .HasOne(i => i.Element)
            .WithMany(e => e.Images)
            .HasForeignKey(i => i.ElementId)
            .OnDelete(DeleteBehavior.Cascade);

        // The gallery is always read ordered, and cover lookups filter on IsPrimary.
        modelBuilder.Entity<ElementImage>()
            .HasIndex(i => new { i.ElementId, i.DisplayOrder });

        modelBuilder.Entity<ElementImage>()
            .HasIndex(i => new { i.ElementId, i.IsPrimary });

        modelBuilder.Entity<Booking>()
            .HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Changed: Booking now relates to Element, not Service directly
        modelBuilder.Entity<Booking>()
            .HasOne(b => b.Element)
            .WithMany()
            .HasForeignKey(b => b.ElementId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}