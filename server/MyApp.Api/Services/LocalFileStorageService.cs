using System.Text;
using Microsoft.Extensions.Options;

namespace MyApp.Api.Services;

public class FileStorageOptions
{
    /// <summary>Hard cap per uploaded image. Defaults to 5 MB.</summary>
    public long MaxFileSizeBytes { get; set; } = 5 * 1024 * 1024;

    /// <summary>Extensions the API accepts (lower-case, with the leading dot).</summary>
    public string[] AllowedExtensions { get; set; } = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    /// <summary>Folder under wwwroot that holds every upload.</summary>
    public string UploadsFolder { get; set; } = "uploads";
}

/// <summary>
/// Stores images on local disk under wwwroot/uploads so ASP.NET's static file
/// middleware can serve them. Filenames are random GUIDs, which keeps uploads
/// unguessable and avoids collisions/overwrites.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly FileStorageOptions _options;
    private readonly ILogger<LocalFileStorageService> _logger;

    // Magic bytes for the formats we accept. The extension must agree with the
    // actual file signature, otherwise "logo.png" could hide an executable.
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    public LocalFileStorageService(
        IWebHostEnvironment environment,
        IOptions<FileStorageOptions> options,
        ILogger<LocalFileStorageService> logger)
    {
        _environment = environment;
        _options = options.Value;
        _logger = logger;

        Directory.CreateDirectory(UploadsRoot);
    }

    /// <summary>Absolute path of wwwroot/uploads.</summary>
    private string UploadsRoot =>
        Path.Combine(_environment.ContentRootPath, "wwwroot", _options.UploadsFolder);

    public async Task<StoredFile> SaveAsync(IFormFile file, string folder, CancellationToken cancellationToken = default)
    {
        if (file is null)
        {
            throw new FileStorageException("No file was provided.");
        }

        if (file.Length <= 0)
        {
            throw new FileStorageException("The uploaded file is empty.");
        }

        if (file.Length > _options.MaxFileSizeBytes)
        {
            throw new FileStorageException(
                $"\"{file.FileName}\" is larger than {_options.MaxFileSizeBytes / (1024 * 1024)} MB.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension) || !_options.AllowedExtensions.Contains(extension))
        {
            throw new FileStorageException(
                $"\"{file.FileName}\" is not a supported image. Allowed types: {string.Join(", ", _options.AllowedExtensions)}.");
        }

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            throw new FileStorageException($"\"{file.FileName}\" is not an image file.");
        }

        if (!await HasValidSignatureAsync(file, extension, cancellationToken))
        {
            throw new FileStorageException($"\"{file.FileName}\" is not a valid {extension} image.");
        }

        var folderPath = Path.Combine(UploadsRoot, folder);
        Directory.CreateDirectory(folderPath);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var absolutePath = Path.Combine(folderPath, fileName);

        await using (var target = new FileStream(absolutePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await using var source = file.OpenReadStream();
            await source.CopyToAsync(target, cancellationToken);
        }

        return new StoredFile
        {
            Url = $"/{_options.UploadsFolder}/{folder}/{fileName}",
            RelativePath = $"{_options.UploadsFolder}/{folder}/{fileName}",
            FileName = fileName
        };
    }

    public async Task<List<StoredFile>> SaveManyAsync(
        IEnumerable<IFormFile> files,
        string folder,
        CancellationToken cancellationToken = default)
    {
        var saved = new List<StoredFile>();

        try
        {
            foreach (var file in files)
            {
                saved.Add(await SaveAsync(file, folder, cancellationToken));
            }
        }
        catch
        {
            // Never leave orphaned files behind when one of the batch is rejected.
            await DeleteManyAsync(saved.Select(s => s.Url), cancellationToken);
            throw;
        }

        return saved;
    }

    public Task DeleteAsync(string? url, CancellationToken cancellationToken = default)
    {
        if (!IsManagedUrl(url))
        {
            return Task.CompletedTask;
        }

        var absolutePath = Path.GetFullPath(
            Path.Combine(_environment.ContentRootPath, "wwwroot", url!.TrimStart('/')));

        // Defence in depth: refuse anything that resolves outside the uploads root.
        if (!absolutePath.StartsWith(UploadsRoot, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Refused to delete {Url}: outside the uploads directory.", url);
            return Task.CompletedTask;
        }

        try
        {
            if (File.Exists(absolutePath))
            {
                File.Delete(absolutePath);
            }
        }
        catch (IOException ex)
        {
            _logger.LogWarning(ex, "Could not delete uploaded file {Path}.", absolutePath);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Not allowed to delete uploaded file {Path}.", absolutePath);
        }

        return Task.CompletedTask;
    }

    public async Task DeleteManyAsync(IEnumerable<string?> urls, CancellationToken cancellationToken = default)
    {
        foreach (var url in urls)
        {
            try
            {
                await DeleteAsync(url, cancellationToken);
            }
            catch (Exception ex)
            {
                // Batch cleanup is best effort — a stuck file must not fail the request.
                _logger.LogWarning(ex, "Could not delete uploaded file {Url}.", url);
            }
        }
    }

    /// <summary>
    /// True when the value looks like a file this service owns ("/uploads/...").
    /// External URLs and nulls are skipped so we never delete something we do not own.
    /// </summary>
    private bool IsManagedUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return false;
        }

        var prefix = $"/{_options.UploadsFolder}/";
        return url.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
               && !url.Contains("..", StringComparison.Ordinal);
    }

    private static async Task<bool> HasValidSignatureAsync(IFormFile file, string extension, CancellationToken cancellationToken)
    {
        var header = new byte[12];
        int read;

        await using (var stream = file.OpenReadStream())
        {
            read = await stream.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, cancellationToken);
        }

        if (read < 4)
        {
            return false;
        }

        return extension switch
        {
            ".jpg" or ".jpeg" => header.AsSpan(0, 3).SequenceEqual(JpegSignature),
            ".png" => read >= 8 && header.AsSpan(0, 8).SequenceEqual(PngSignature),
            ".gif" => Encoding.ASCII.GetString(header, 0, 6) is "GIF87a" or "GIF89a",
            ".webp" => Encoding.ASCII.GetString(header, 0, 4) == "RIFF"
                       && read >= 12
                       && Encoding.ASCII.GetString(header, 8, 4) == "WEBP",
            _ => false
        };
    }
}
