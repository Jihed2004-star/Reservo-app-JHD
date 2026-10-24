import apiClient from './client';
import type { ElementItem } from '../types/catalog';

export async function getElementById(id: string): Promise<ElementItem> {
  const res = await apiClient.get<ElementItem>(`/elements/${id}`);
  return res.data;
}

export interface AvailabilitySlot {
  id: string;
  elementId: string;
  startTime: string;
  endTime: string;
}

export async function getAvailability(elementId: string): Promise<AvailabilitySlot[]> {
  const res = await apiClient.get<AvailabilitySlot[]>('/availability', {
    params: { elementId },
  });
  return res.data;
}
export interface BookedRange {
  startTime: string;
  endTime: string;
}

export async function getBookedRanges(elementId: string): Promise<BookedRange[]> {
  const res = await apiClient.get<BookedRange[]>(`/bookings/by-element/${elementId}`);
  return res.data;
}
export interface BookingRequest {
  elementId: string;
  startTime: string;
  endTime: string;
}

export interface BookingResponse {
  id: string;
  elementId: string;
  elementName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  hasReview: boolean;
  clientName: string;
}
export interface BookingConflict {
  bookingId: string;
  startTime: string;
  endTime: string;
}

export interface AvailabilityInterval {
  startTime: string;
  endTime: string;
}

export interface RemoveAvailabilityIntervalsRequest {
  elementId: string;
  intervals: AvailabilityInterval[];
}

export interface RemoveAvailabilityIntervalResponse {
  removedSlots: number;
  trimmedSlots: number;
  createdSlots: number;
}

/**
 * Removes one or more intervals from an element's availability in a single request.
 * The server trims the surrounding slot and splits it when an interval sits in the
 * middle, so a provider can close single hours without deleting the whole day.
 */
export async function removeAvailabilityIntervals(
  data: RemoveAvailabilityIntervalsRequest
): Promise<RemoveAvailabilityIntervalResponse> {
  const res = await apiClient.post<RemoveAvailabilityIntervalResponse>(
    '/availability/intervals/remove',
    data
  );
  return res.data;
}

export async function createBooking(data: BookingRequest): Promise<BookingResponse> {
  const res = await apiClient.post<BookingResponse>('/bookings', data);
  return res.data;
}
export async function getMyBookings(): Promise<BookingResponse[]> {
  const res = await apiClient.get<BookingResponse[]>('/bookings/mine');
  return res.data;
}

export async function cancelBooking(bookingId: string): Promise<BookingResponse> {
  const res = await apiClient.put<BookingResponse>(`/bookings/${bookingId}/cancel`);
  return res.data;
}

export interface ElementRequest {
  serviceId: string;
  name: string;
  orderIndex: number;
  price: number;
  attributes: Record<string, string>;
  /** Optional photos uploaded with the element; the first one becomes the cover. */
  images?: File[];
}

export async function createElement(data: ElementRequest): Promise<ElementItem> {
  // Multipart so photos can travel with the element in a single request.
  // Attributes are sent as JSON because form binding of nested dictionaries is
  // unreliable across clients.
  const form = new FormData();
  form.append('ServiceId', data.serviceId);
  form.append('Name', data.name);
  form.append('OrderIndex', String(data.orderIndex));
  form.append('Price', String(data.price));
  form.append('AttributesJson', JSON.stringify(data.attributes ?? {}));
  (data.images ?? []).forEach((file) => form.append('Images', file));

  const res = await apiClient.post<ElementItem>('/elements', form);
  return res.data;
}

export async function toggleElementActive(id: string): Promise<ElementItem> {
  const res = await apiClient.patch<ElementItem>(`/elements/${id}/toggle-active`);
  return res.data;
}

export interface GenerateAvailabilityRequest {
  elementId: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  fromDate: string;
  toDate: string;
}

export interface GenerateAvailabilityResponse {
  slotsCreated: number;
  slotsSkipped: number;
  fromDate: string;
  toDate: string;
}

export async function generateAvailability(data: GenerateAvailabilityRequest): Promise<GenerateAvailabilityResponse> {
  const res = await apiClient.post<GenerateAvailabilityResponse>('/availability/generate', data);
  return res.data;
}

export async function getBookingsForProvider(elementId: string): Promise<BookingResponse[]> {
  const res = await apiClient.get<BookingResponse[]>(`/bookings/for-provider/${elementId}`);
  return res.data;
}

export async function deleteElement(id: string): Promise<void> {
  await apiClient.delete(`/elements/${id}`);
}

