export interface Category {
  id: string;
  name: string;
  description: string | null;
  /** Server-relative upload path ("/uploads/categories/…") or null when unset. */
  imageUrl?: string | null;
  createdAt: string;
  isActive: boolean;
  averageRating?: number | null;
  reviewCount: number;
  minPrice?: number | null;
  maxPrice?: number | null;
}

export type BookingUnit = 'Hourly' | 'Daily' | 'Monthly';

/** One uploaded photo belonging to an element. */
export interface ElementImage {
  id: string;
  elementId: string;
  /** Server-relative upload path ("/uploads/elements/…"). */
  url: string;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ElementItem {
  id: string;
  serviceId: string;
  name: string;
  orderIndex: number;
  price: number;
  attributes: Record<string, string>;
  bookingUnit: BookingUnit;
  isActive: boolean;
  /** Uploaded photos, primary first. Empty when the provider added none. */
  images?: ElementImage[];
  /** Cover URL shortcut returned by the API (null when the gallery is empty). */
  primaryImageUrl?: string | null;
}

export interface Service {
  id: string;
  categoryId: string;
  categoryName: string;
  providerId: string;
  name: string;
  description: string | null;
  /** Server-relative upload path ("/uploads/services/…") or null when unset. */
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  elements: ElementItem[];
  bookingUnit: BookingUnit;
}

export interface AvailabilitySlot {
  id: string;
  elementId: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  elementId: string;
  elementName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}
