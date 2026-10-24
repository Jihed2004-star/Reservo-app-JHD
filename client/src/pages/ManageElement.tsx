import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import {
  getElementById,
  getAvailability,
  generateAvailability,
  getBookingsForProvider,
  toggleElementActive,
  deleteElement,
  cancelBooking,
  removeAvailabilityIntervals,
} from '../api/elements';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge, statusToVariant } from '../components/ui/Badge';
import { ImageGalleryEditor } from '../components/ui/ImageGalleryEditor';
import { deleteElementImage, setPrimaryElementImage, uploadElementImages } from '../api/images';
import '../index.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Light-theme event colors. Distinct from ElementDetail's read-only
// availability/booked colors (indigo-400 / rose-500 background layers) since
// these are interactive, clickable slot states rather than a passive legend.
const COLOR_OPEN = '#4f46e5'; // indigo-600 (Available)
const COLOR_SELECTED = '#0f172a'; // slate-900 (Selected for deletion)
const COLOR_BOOKED = '#f43f5e'; // rose-500 (Reserved / Booked)
const COLOR_COMPLETED = '#10b981'; // emerald-500 (Completed)

// Availability is stored as one window per day (e.g. 08:00-17:00). The provider
// calendar slices each window into clickable intervals so a single hour can be
// closed without deleting the whole day.
const INTERVAL_MINUTES = 60;

interface SelectedInterval {
  key: string;
  slotId: string;
  start: string;
  end: string;
}

function intervalKey(slotId: string, start: string, end: string): string {
  return `${slotId}|${start}|${end}`;
}

function chunkInterval(
  start: string,
  end: string,
  stepMinutes: number
): Array<{ start: string; end: string }> {
  const step = stepMinutes * 60_000;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return [];

  const chunks: Array<{ start: string; end: string }> = [];
  for (let cursor = startMs; cursor < endMs; cursor += step) {
    const next = Math.min(cursor + step, endMs);
    chunks.push({ start: new Date(cursor).toISOString(), end: new Date(next).toISOString() });
  }

  return chunks;
}

// All-day events must use plain YYYY-MM-DD strings, otherwise a UTC midnight
// timestamp shifts the block onto the previous day in negative offsets.
function toAllDayRange(start: string, end: string): { start: string; end: string } {
  const startDate = start.slice(0, 10);
  let endDate = end.slice(0, 10);

  if (endDate <= startDate) {
    const next = new Date(`${startDate}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    endDate = next.toISOString().slice(0, 10);
  }

  return { start: startDate, end: endDate };
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

function formatInterval(start?: string, end?: string, allDay = false): string {
  if (!start || !end) return '';

  if (allDay) {
    const from = new Date(`${start.slice(0, 10)}T00:00:00`);
    const to = new Date(`${end.slice(0, 10)}T00:00:00`);
    to.setDate(to.getDate() - 1);
    const fromLabel = from.toLocaleDateString();
    const toLabel = to.toLocaleDateString();
    return fromLabel === toLabel ? fromLabel : `${fromLabel} -> ${toLabel}`;
  }

  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${new Date(start).toLocaleTimeString([], options)} - ${new Date(end).toLocaleTimeString([], options)}`;
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

function computeOpenIntervals(
  slot: { startTime: string; endTime: string },
  confirmedBookings: Array<{ startTime: string; endTime: string }>
): Array<{ start: string; end: string }> {
  const slotStart = new Date(slot.startTime).getTime();
  const slotEnd = new Date(slot.endTime).getTime();
  if (slotEnd <= slotStart) return [];

  const overlaps = confirmedBookings
    .map((b) => ({
      start: Math.max(slotStart, new Date(b.startTime).getTime()),
      end: Math.min(slotEnd, new Date(b.endTime).getTime()),
    }))
    .filter((b) => b.end > b.start)
    .sort((a, b) => a.start - b.start);

  if (overlaps.length === 0) {
    return [{ start: slot.startTime, end: slot.endTime }];
  }

  const mergedBooked: Array<{ start: number; end: number }> = [];
  for (const b of overlaps) {
    const last = mergedBooked[mergedBooked.length - 1];
    if (last && b.start <= last.end) {
      last.end = Math.max(last.end, b.end);
    } else {
      mergedBooked.push({ start: b.start, end: b.end });
    }
  }

  const openIntervals: Array<{ start: string; end: string }> = [];
  let current = slotStart;

  for (const b of mergedBooked) {
    if (b.start > current) {
      openIntervals.push({
        start: new Date(current).toISOString(),
        end: new Date(b.start).toISOString(),
      });
    }
    current = Math.max(current, b.end);
  }

  if (current < slotEnd) {
    openIntervals.push({
      start: new Date(current).toISOString(),
      end: new Date(slotEnd).toISOString(),
    });
  }

  return openIntervals;
}

export default function ManageElement() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const [selectedIntervals, setSelectedIntervals] = useState<SelectedInterval[]>([]);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  const { data: element, isLoading, error } = useQuery({
    queryKey: ['element', id],
    queryFn: () => getElementById(id!),
    enabled: !!id,
  });

  const { data: slots } = useQuery({
    queryKey: ['availability', id],
    queryFn: () => getAvailability(id!),
    enabled: !!id,
  });

  const { data: bookings } = useQuery({
    queryKey: ['providerBookings', id],
    queryFn: () => getBookingsForProvider(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: generateAvailability,
    onSuccess: (res) => {
      const skippedNote = res.slotsSkipped > 0 ? ` (${res.slotsSkipped} skipped — already existed)` : '';
      setSuccessMsg(`Created ${res.slotsCreated} availability slots${skippedNote}.`);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['availability', id] });
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Could not generate availability.');
      setSuccessMsg(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteElement,
    onSuccess: () => navigate(`/provider/services/${element?.serviceId}`),
    onError: (err: any) => setDeleteError(err?.response?.data?.message ?? 'Could not delete element.'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleElementActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['element', id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerBookings', id] });
    },
  });

  // Gallery actions hit the API immediately: the server owns ordering, the
  // primary flag and the files on disk, so the element query is refreshed after
  // each one instead of patching local state by hand.
  const refreshElement = () => {
    queryClient.invalidateQueries({ queryKey: ['element', id] });
    queryClient.invalidateQueries({ queryKey: ['service', element?.serviceId] });
  };

  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => uploadElementImages(id!, files),
    onSuccess: () => {
      setGalleryError(null);
      refreshElement();
    },
    onError: (err: any) => {
      setGalleryError(err?.response?.data?.message ?? 'Could not upload the photo.');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => deleteElementImage(id!, imageId),
    onSuccess: () => {
      setGalleryError(null);
      refreshElement();
    },
    onError: (err: any) => {
      setGalleryError(err?.response?.data?.message ?? 'Could not delete the photo.');
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (imageId: string) => setPrimaryElementImage(id!, imageId),
    onSuccess: () => {
      setGalleryError(null);
      refreshElement();
    },
    onError: (err: any) => {
      setGalleryError(err?.response?.data?.message ?? 'Could not set the cover photo.');
    },
  });

  const galleryBusy =
    uploadImagesMutation.isPending ||
    deleteImageMutation.isPending ||
    setPrimaryMutation.isPending;

  const removeIntervalsMutation = useMutation({
    mutationFn: (intervals: SelectedInterval[]) =>
      removeAvailabilityIntervals({
        elementId: id!,
        intervals: intervals.map((interval) => ({
          startTime: interval.start,
          endTime: interval.end,
        })),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['availability', id] });
      setSelectedIntervals([]);
      setCalendarError(null);
      setCalendarNotice(
        `Availability updated - ${res.createdSlots} open range${res.createdSlots === 1 ? '' : 's'} kept bookable.`
      );
    },
    onError: (err: any) => {
      const conflicts = err?.response?.data?.conflictingBookings;
      setCalendarNotice(null);
      setCalendarError(
        conflicts?.length
          ? `Can't remove - ${conflicts.length} confirmed booking(s) fall inside the selection.`
          : err?.response?.data?.message ?? 'Could not remove the selected intervals.'
      );
    },
  });

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function localTimeToUtcTimeString(time: string, referenceDate: string): string {
    // time: "08:00", referenceDate: "2026-07-20" (any date in the picked range works)
    const local = new Date(`${referenceDate}T${time}:00`);
    const hh = String(local.getUTCHours()).padStart(2, '0');
    const mm = String(local.getUTCMinutes()).padStart(2, '0');
    const ss = String(local.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  function handleGenerate() {
    if (!id || selectedDays.length === 0 || !fromDate || !toDate) {
      setFormError('Select at least one day and a full date range.');
      return;
    }
    setSuccessMsg(null);

    const isFullDay = element?.bookingUnit !== 'Hourly';
    mutation.mutate({
      elementId: id,
      daysOfWeek: selectedDays,
      startTime: isFullDay ? '00:00:00' : localTimeToUtcTimeString(startTime, fromDate),
      endTime: isFullDay ? '00:00:00' : localTimeToUtcTimeString(endTime, fromDate),
      fromDate,
      toDate,
    });
  }

  function handleEventClick(info: EventClickArg) {
    const { type, slotId, key, start, end, hasBooking, booking } = info.event.extendedProps as {
      type: string;
      slotId?: string;
      key?: string;
      start?: string;
      end?: string;
      hasBooking?: boolean;
      booking?: any;
    };

    if (type === 'booking') {
      if (booking) {
        const s = new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const e = new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isDone = booking.status === 'Completed';
        setCalendarError(
          `${isDone ? 'Completed booking' : 'Reserved'} by ${booking.clientName || 'Client'} (${s} - ${e}). Status: ${booking.status}.${isDone ? '' : ' Confirmed bookings cannot be deleted.'}`
        );
      }
      return;
    }

    if (type === 'availability' && slotId && key && start && end) {
      if (hasBooking) {
        setCalendarError('This interval overlaps a confirmed booking and cannot be removed until the booking is cancelled.');
        return;
      }

      setCalendarError(null);
      setCalendarNotice(null);
      setSelectedIntervals((prev) =>
        prev.some((s) => s.key === key)
          ? prev.filter((s) => s.key !== key)
          : [...prev, { key, slotId, start, end }]
      );
    }
  }

  function handleRemoveSelected() {
    if (selectedIntervals.length === 0) return;

    const label = `${selectedIntervals.length} interval${selectedIntervals.length === 1 ? '' : 's'}`;
    if (!confirm(`Remove ${label} of availability? Confirmed bookings block removal.`)) return;

    removeIntervalsMutation.mutate(selectedIntervals);
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-slate-500">You don't have access to this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error || !element) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
            <p className="font-semibold text-rose-700">Couldn't load this element</p>
            <p className="mt-1 text-sm text-rose-500">
              Something went wrong on our end — try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isHourly = element.bookingUnit === 'Hourly';

  const calendarBookings = (bookings ?? []).filter(
    (b) => b.status === 'Confirmed' || b.status === 'Completed'
  );

  const bookingEvents = calendarBookings.map((b) => {
    const dayRange = isHourly ? null : toAllDayRange(b.startTime, b.endTime);
    const isCompleted = b.status === 'Completed';
    const color = isCompleted ? COLOR_COMPLETED : COLOR_BOOKED;

    return {
      id: `booking-${b.id}`,
      title: '',
      start: dayRange ? dayRange.start : b.startTime,
      end: dayRange ? dayRange.end : b.endTime,
      allDay: !isHourly,
      display: 'block' as const,
      editable: false,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { type: 'booking', booking: b },
    };
  });

  const availabilityEvents = (slots ?? []).flatMap((slot) => {
    const openIntervals = computeOpenIntervals(slot, calendarBookings);
    const overlappingBookings = calendarBookings.filter((b) =>
      rangesOverlap(slot.startTime, slot.endTime, b.startTime, b.endTime)
    );
    const hasBooking = overlappingBookings.length > 0;

    // A day holding a booking is fully reserved; the booking block covers it
    // and nothing on that day may be selected for removal.
    if (!isHourly && hasBooking) return [];

    return openIntervals.flatMap((interval, intervalIdx) => {
      // Hourly elements get one clickable block per hour so single hours can be
      // closed; daily/monthly elements keep a single block per day.
      const blocks = isHourly
        ? chunkInterval(interval.start, interval.end, INTERVAL_MINUTES)
        : [{ start: interval.start, end: interval.end }];

      return blocks.map((block, blockIdx) => {
        const key = intervalKey(slot.id, block.start, block.end);
        const selected = selectedIntervals.some((s) => s.key === key);
        const color = selected ? COLOR_SELECTED : COLOR_OPEN;
        const dayRange = isHourly ? null : toAllDayRange(block.start, block.end);
        // Check the block itself, not the whole slot: a slot can hold a booking
        // at 10:00 while the 09:00 block is still free to close.
        const blockHasBooking = calendarBookings.some((b) =>
          rangesOverlap(block.start, block.end, b.startTime, b.endTime)
        );

        return {
          id: `avail-${slot.id}-${intervalIdx}-${blockIdx}`,
          title: '',
          start: dayRange ? dayRange.start : block.start,
          end: dayRange ? dayRange.end : block.end,
          allDay: !isHourly,
          display: 'block' as const,
          editable: false,
          backgroundColor: color,
          borderColor: color,
          extendedProps: {
            type: 'availability',
            slotId: slot.id,
            key,
            start: block.start,
            end: block.end,
            hasBooking: blockHasBooking,
          },
        };
      });
    });
  });

  const selectedMinutes = Math.round(
    selectedIntervals.reduce(
      (total, interval) =>
        total + (new Date(interval.end).getTime() - new Date(interval.start).getTime()) / 60_000,
      0
    )
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{element.name}</h1>
              <StatusBadge isActive={element.isActive} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              ${element.price} · {element.bookingUnit} booking
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => toggleMutation.mutate(element.id)}
              disabled={toggleMutation.isPending}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                element.isActive
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {element.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this element permanently? This cannot be undone.')) {
                  deleteMutation.mutate(element.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
        {deleteError && <p className="mt-4 text-sm text-amber-600">{deleteError}</p>}

        {/* Photos */}
        <div className="mt-8">
          <ImageGalleryEditor
            images={element.images ?? []}
            busy={galleryBusy}
            onUpload={(files) => uploadImagesMutation.mutate(files)}
            onDelete={(imageId) => deleteImageMutation.mutate(imageId)}
            onSetPrimary={(imageId) => setPrimaryMutation.mutate(imageId)}
            error={galleryError}
          />
        </div>

        {/* Generate Availability */}
        <h2 className="mt-8 text-lg font-bold text-slate-900">Generate Availability</h2>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label className={labelClass}>Days of week</label>
          <div className="mb-4 flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedDays.includes(day)
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {isHourly && (
            <div className="mb-4 flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>Start time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>End time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div className="mb-4 flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>From date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className={labelClass}>To date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={mutation.isPending}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Generating...' : 'Generate'}
          </button>

          {formError && <p className="mt-3 text-sm text-amber-600">{formError}</p>}
          {successMsg && <p className="mt-3 text-sm text-emerald-600">{successMsg}</p>}
        </div>

        {/* Calendar */}
        <h2 className="mt-8 text-lg font-bold text-slate-900">Availability Calendar</h2>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_OPEN }} />
            Available — click a block to select
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_SELECTED }} />
            Selected for removal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_BOOKED }} />
            Reserved / Booked (hover for details)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_COMPLETED }} />
            Completed (past booking)
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {isHourly
            ? 'Each block is one hour. Pick the hours you want to close, then remove them in one go.'
            : 'Each block is one day. Pick the days you want to close, then remove them in one go.'}
        </p>
        {calendarError && <p className="mt-3 text-sm text-amber-600">{calendarError}</p>}
        {calendarNotice && <p className="mt-3 text-sm text-emerald-600">{calendarNotice}</p>}

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 fc-light-theme">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={isHourly ? 'timeGridWeek' : 'dayGridMonth'}
            allDaySlot={!isHourly}
            slotDuration={isHourly ? '01:00:00' : undefined}
            snapDuration={isHourly ? '01:00:00' : undefined}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
            events={[...availabilityEvents, ...bookingEvents]}
            eventClick={handleEventClick}
            eventContent={(arg) => (
              <div className={arg.event.allDay ? 'h-4 w-full' : 'h-full w-full'} />
            )}
            eventDidMount={(info) => {
              const { type, booking } = (info.event.extendedProps || {}) as any;
              if (type === 'booking' && booking) {
                const range = formatInterval(booking.startTime, booking.endTime, info.event.allDay);
                const prefix = booking.status === 'Completed' ? 'Completed' : 'Reserved';
                info.el.title = `${prefix}: ${booking.clientName || 'Client'} (${range})`;
              } else if (type === 'availability') {
                const { start, end } = (info.event.extendedProps || {}) as { start?: string; end?: string };
                const range = formatInterval(start, end, info.event.allDay);
                info.el.title = range ? `${range} · Click to select` : 'Click to select';
              }
            }}
            height="auto"
          />
        </div>

        {selectedIntervals.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{selectedIntervals.length}</span>{' '}
              {isHourly
                ? `interval${selectedIntervals.length !== 1 ? 's' : ''} selected · ${formatDuration(selectedMinutes)} total`
                : `day${selectedIntervals.length !== 1 ? 's' : ''} selected`}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setSelectedIntervals([])}
                className="rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Clear selection
              </button>
              <button
                onClick={handleRemoveSelected}
                disabled={removeIntervalsMutation.isPending}
                className="rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
              >
                {removeIntervalsMutation.isPending ? 'Removing...' : 'Remove selected'}
              </button>
            </div>
          </div>
        )}

        {/* Bookings */}
        <h2 className="mt-8 text-lg font-bold text-slate-900">Bookings</h2>
        <div className="mt-3">
          {bookings?.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="font-semibold text-slate-900">No bookings yet</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {bookings?.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{b.clientName}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(b.startTime).toLocaleString()} — {new Date(b.endTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={statusToVariant(b.status)}>{b.status}</Badge>
                    {b.status === 'Confirmed' && (
                      <button
                        onClick={() => cancelMutation.mutate(b.id)}
                        disabled={cancelMutation.isPending}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}