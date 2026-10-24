import type { ElementImage } from '../../types/catalog';
import { resolveImageUrl } from '../../utils/images';
import { ACCEPTED_IMAGE_TYPES } from './ImageUploader';

interface ImageGalleryEditorProps {
  images: ElementImage[];
  /** Upper bound enforced by the API (ElementsController.MaxImagesPerElement). */
  max?: number;
  /** Disables every control while a gallery request is in flight. */
  busy?: boolean;
  onUpload: (files: File[]) => void;
  onDelete: (imageId: string) => void;
  onSetPrimary: (imageId: string) => void;
  error?: string | null;
}

/**
 * Gallery manager for an existing element. Every action hits the API
 * immediately — unlike MultiImageUploader, nothing is staged here.
 */
export function ImageGalleryEditor({
  images,
  max = 8,
  busy = false,
  onUpload,
  onDelete,
  onSetPrimary,
  error,
}: ImageGalleryEditorProps) {
  const atLimit = images.length >= max;

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">Photos</h2>
        <span className="text-xs font-medium text-slate-400">
          {images.length}/{max}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative h-28 w-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
          >
            <img
              src={resolveImageUrl(image.url) ?? ''}
              alt=""
              className="h-full w-full object-cover"
            />

            {image.isPrimary && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-slate-900/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Cover
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-slate-900/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!image.isPrimary && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onSetPrimary(image.id)}
                  title="Use as cover"
                  className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-800 hover:bg-white disabled:opacity-50"
                >
                  Set cover
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(image.id)}
                title="Delete photo"
                className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!atLimit && (
          <label
            className={`flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-xs font-medium transition-colors ${
              busy
                ? 'cursor-not-allowed border-slate-200 text-slate-300'
                : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            <span className="text-xl leading-none">+</span>
            Add photo
            <input
              type="file"
              multiple
              accept={ACCEPTED_IMAGE_TYPES}
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const picked = Array.from(event.target.files ?? []);
                if (picked.length > 0) onUpload(picked.slice(0, max - images.length));
                event.target.value = '';
              }}
            />
          </label>
        )}
      </div>

      {images.length === 0 && (
        <p className="mt-3 text-xs text-slate-400">
          No photos yet — the first upload becomes the cover shown in listings.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-amber-600">{error}</p>}
    </div>
  );
}
