import { useEffect, useMemo, useState } from 'react';
import { resolveImageUrl } from '../../utils/images';

/** Mirrors FileStorageOptions.AllowedExtensions on the API. */
export const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp,image/gif';
/** Mirrors FileStorageOptions.MaxFileSizeBytes on the API. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
const hintClass = 'mt-1.5 text-xs text-slate-400';
const secondaryButtonClass =
  'rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-50';

/** Object URLs must be revoked or the blob leaks for the whole session. */
function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

interface ImageUploaderProps {
  label: string;
  hint?: string;
  /** Cover already stored on the server (relative path or absolute URL). */
  existingUrl?: string | null;
  /** Newly picked file — wins over `existingUrl` in the preview. */
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** True once the user asked to drop the stored cover. */
  removedExisting?: boolean;
  onRemoveExistingChange?: (removed: boolean) => void;
  disabled?: boolean;
}

/**
 * Single-image picker with a live preview, used for the category/service cover.
 * The file is only uploaded when the surrounding form is submitted.
 */
export function ImageUploader({
  label,
  hint = 'PNG, JPG, WEBP or GIF — up to 5 MB.',
  existingUrl,
  file,
  onFileChange,
  removedExisting = false,
  onRemoveExistingChange,
  disabled = false,
}: ImageUploaderProps) {
  const localUrl = useObjectUrl(file);
  const storedUrl = removedExisting ? null : resolveImageUrl(existingUrl);
  const previewUrl = localUrl ?? storedUrl;
  const hasImage = Boolean(previewUrl);

  return (
    <div className="mb-5">
      <label className={labelClass}>{label}</label>

      <div className="overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white">
        {hasImage ? (
          <img src={previewUrl!} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <path d="M21 15l-5-5-4 4-2-2-5 5" />
            </svg>
            <span className="text-xs font-medium">No image selected</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            disabled
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {hasImage ? 'Replace image' : 'Choose image'}
          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const picked = event.target.files?.[0] ?? null;
              onFileChange(picked);
              // Reset so picking the same file twice still fires a change.
              event.target.value = '';
            }}
          />
        </label>

        {hasImage && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onFileChange(null);
              onRemoveExistingChange?.(true);
            }}
            className={secondaryButtonClass}
          >
            Remove
          </button>
        )}

        {removedExisting && !file && (
          <span className="text-xs font-medium text-amber-600">Will be removed on save</span>
        )}
      </div>

      {hint && <p className={hintClass}>{hint}</p>}
    </div>
  );
}


/** Same idea as useObjectUrl, but for a list of staged files. */
function useObjectUrls(files: File[]): string[] {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);

  return urls;
}

interface MultiImageUploaderProps {
  label: string;
  hint?: string;
  /** Files staged for upload; they travel with the form submit. */
  files: File[];
  onFilesChange: (files: File[]) => void;
  max?: number;
  disabled?: boolean;
}

/**
 * Multi-file picker for galleries created together with their parent (e.g. a
 * new element). Files are kept in memory until the form is submitted.
 */
export function MultiImageUploader({
  label,
  hint = 'PNG, JPG, WEBP or GIF — up to 5 MB each. The first photo becomes the cover.',
  files,
  onFilesChange,
  max = 8,
  disabled = false,
}: MultiImageUploaderProps) {
  const urls = useObjectUrls(files);
  const atLimit = files.length >= max;

  return (
    <div className="mb-5">
      <label className={labelClass}>{label}</label>

      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <div key={`${file.name}-${file.lastModified}-${index}`} className="relative h-20 w-20">
            <img src={urls[index]} alt="" className="h-full w-full rounded-xl object-cover" />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded-full bg-slate-900/85 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFilesChange(files.filter((_, i) => i !== index))}
              aria-label={`Remove ${file.name}`}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white shadow transition-colors hover:bg-rose-700 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        ))}

        {!atLimit && (
          <label
            className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-xs font-medium transition-colors ${
              disabled
                ? 'cursor-not-allowed border-slate-200 text-slate-300'
                : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            <span className="text-lg leading-none">+</span>
            Add
            <input
              type="file"
              multiple
              accept={ACCEPTED_IMAGE_TYPES}
              className="sr-only"
              disabled={disabled}
              onChange={(event) => {
                const picked = Array.from(event.target.files ?? []);
                onFilesChange([...files, ...picked].slice(0, max));
                event.target.value = '';
              }}
            />
          </label>
        )}
      </div>

      <p className={hintClass}>
        {files.length}/{max} selected{hint ? ` — ${hint}` : ''}
      </p>
    </div>
  );
}
