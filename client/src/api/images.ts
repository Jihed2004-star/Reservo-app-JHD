import apiClient from './client';
import type { ElementImage } from '../types/catalog';

/**
 * Uploads one or more photos to an element's gallery. The first photo of an
 * empty gallery becomes the cover; the server enforces a per-element cap.
 */
export async function uploadElementImages(
  elementId: string,
  files: File[]
): Promise<ElementImage[]> {
  const form = new FormData();
  files.forEach((file) => form.append('Files', file));

  const res = await apiClient.post<ElementImage[]>(`/elements/${elementId}/images`, form);
  return res.data;
}

/** Deletes a photo and its file. The server promotes a new cover if needed. */
export async function deleteElementImage(elementId: string, imageId: string): Promise<void> {
  await apiClient.delete(`/elements/${elementId}/images/${imageId}`);
}

/** Flags one photo as the cover; every other photo loses the flag. */
export async function setPrimaryElementImage(
  elementId: string,
  imageId: string
): Promise<ElementImage[]> {
  const res = await apiClient.patch<ElementImage[]>(
    `/elements/${elementId}/images/${imageId}/primary`
  );
  return res.data;
}
