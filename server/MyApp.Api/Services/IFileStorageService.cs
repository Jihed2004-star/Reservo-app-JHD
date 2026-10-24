namespace MyApp.Api.Services;

/// <summary>
/// Folder names used under wwwroot/uploads. Kept in one place so the storage
/// service, the controllers and the frontend all agree on the URL shape.
/// </summary>
public static class StorageFolders
{
    public const string Categories = "categories";
    public const string Services = "services";
    public const string Elements = "elements";
}

/// <summary>Result of a successful upload.</summary>
public sealed class StoredFile
{
    /// <summary>Relative URL served by the API, e.g. "/uploads/elements/8f3c.webp".</summary>
    public string Url { get; init; } = string.Empty;

    /// <summary>Path relative to wwwroot, e.g. "uploads/elements/8f3c.webp".</summary>
    public string RelativePath { get; init; } = string.Empty;

    public string FileName { get; init; } = string.Empty;
}

/// <summary>Thrown when an upload fails validation. Controllers map it to a 400.</summary>
public class FileStorageException : Exception
{
    public FileStorageException(string message) : base(message)
    {
    }
}

public interface IFileStorageService
{
    /// <summary>
    /// Validates and persists an uploaded image, returning its public URL.
    /// </summary>
    /// <exception cref="FileStorageException">The file is empty, too large or not a supported image.</exception>
    Task<StoredFile> SaveAsync(IFormFile file, string folder, CancellationToken cancellationToken = default);

    /// <summary>
    /// Persists several images. Fails fast (and rolls back the files it already
    /// wrote) if any of them is invalid, so a gallery never ends up half-saved.
    /// </summary>
    Task<List<StoredFile>> SaveManyAsync(IEnumerable<IFormFile> files, string folder, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a previously uploaded file. Values that are not managed upload
    /// URLs (nulls, external URLs, path-traversal attempts) are ignored.
    /// </summary>
    Task DeleteAsync(string? url, CancellationToken cancellationToken = default);

    /// <summary>Best-effort batch delete; never throws.</summary>
    Task DeleteManyAsync(IEnumerable<string?> urls, CancellationToken cancellationToken = default);
}
