import apiClient from './client';
import type { BookingUnit } from '../types/catalog';

/** Headline numbers for the revenue dashboard. */
export interface RevenueFinancials {
  totalEarned: number;
  upcomingRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  /** Percentage change vs. last month; 0 when both months are empty. */
  monthOverMonthGrowth: number;
  averageBookingValue: number;
  cancelledRevenue: number;
  completedBookingsCount: number;
  upcomingBookingsCount: number;
  cancelledBookingsCount: number;
}

export interface DailyRevenue {
  /** "yyyy-MM-dd" (UTC). Present even when the day earned nothing. */
  date: string;
  revenue: number;
  bookingsCount: number;
}

export interface MonthlyRevenue {
  /** "MMM yyyy", e.g. "Oct 2026". */
  month: string;
  revenue: number;
  bookingsCount: number;
}

export interface ElementRevenue {
  elementId: string;
  elementName: string;
  serviceName: string;
  bookingUnit: BookingUnit;
  unitPrice: number;
  completedBookingsCount: number;
  totalUnitsSold: number;
  totalRevenue: number;
  /** Share of total earned, 0–100. */
  percentageOfTotal: number;
}

export interface RevenueTransaction {
  id: string;
  bookingCode: string;
  customerName: string;
  serviceName: string;
  elementName: string;
  startTime: string;
  endTime: string;
  durationFormatted: string;
  unitPrice: number;
  totalAmount: number;
  /** Effective status: "Completed", "Confirmed" (upcoming) or "Cancelled". */
  status: string;
  createdAt: string;
}

export interface ProviderRevenue {
  financials: RevenueFinancials;
  dailyRevenue: DailyRevenue[];
  monthlyRevenue: MonthlyRevenue[];
  elementBreakdown: ElementRevenue[];
  transactions: RevenueTransaction[];
}

export async function getProviderRevenue(): Promise<ProviderRevenue> {
  const res = await apiClient.get<ProviderRevenue>('/provider/revenue');
  return res.data;
}
