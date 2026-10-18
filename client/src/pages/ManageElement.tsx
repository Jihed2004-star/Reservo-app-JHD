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
  deleteAvailability,
} from '../api/elements';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Badge, statusToVariant } from '../components/ui/Badge';
import Footer from '../components/Footer';
import '../index.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Light-theme event colors. Distinct from ElementDetail's read-only
// availability/booked colors (indigo-400 / rose-500 background layers) since
// these are interactive, clickable slot states rather than a passive legend.
const COLOR_OPEN = '#4f46e5'; // indigo-600
const COLOR_SELECTED = '#f97316'; // orange-500 — kept as-is, already a clear, distinct accent
const COLOR_LOCKED = '#94a3b8'; // slate-400
const COLOR_BOOKED = '#f43f5e'; // rose-500

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
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
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

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

  const deleteSlotsMutation = useMutation({
    mutationFn: async (slotIds: string[]) => {
      await Promise.all(slotIds.map((slotId) => deleteAvailability(slotId)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability', id] });
      setSelectedSlotIds([]);
      setCalendarError(null);
    },
    onError: (err: any) => {
      const conflicts = err?.response?.data?.conflictingBookings;
      setCalendarError(
        conflicts?.length
          ? `Can't delete — ${conflicts.length} confirmed booking(s) depend on one of these slots.`
          : err?.response?.data?.message ?? 'Could not delete slot(s).'
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

  function isSlotLocked(slot: { startTime: string; endTime: string }): boolean {
    return (bookings ?? []).some(
      (b) => b.status === 'Confirmed' && rangesOverlap(slot.startTime, slot.endTime, b.startTime, b.endTime)
    );
  }

  function handleEventClick(info: EventClickArg) {
    const { type, slotId, locked } = info.event.extendedProps as {
      type: string;
      slotId?: string;
      locked?: boolean;
    };
    if (type !== 'availability' || !slotId) return;

    if (locked) {
      setCalendarError("This slot has a confirmed booking and can't be deleted.");
      return;
    }

    setCalendarError(null);
    setSelectedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((s) => s !== slotId) : [...prev, slotId]
    );
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';
  const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return (
      <div className="min-h-screen bg-[#fcfcfd]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-slate-500">You don't have access to this page.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcfd]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !element) {
    return (
      <div className="min-h-screen bg-[#fcfcfd]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
            <p className="font-semibold text-rose-700">Couldn't load this element</p>
            <p className="mt-1 text-sm text-rose-500">
              Something went wrong on our end — try refreshing the page.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isHourly = element.bookingUnit === 'Hourly';

  const availabilityEvents = (slots ?? []).map((slot) => {
    const locked = isSlotLocked(slot);
    const selected = selectedSlotIds.includes(slot.id);
    return {
      id: `avail-${slot.id}`,
      start: slot.startTime,
      end: slot.endTime,
      editable: false,
      backgroundColor: locked ? COLOR_LOCKED : selected ? COLOR_SELECTED : COLOR_OPEN,
      borderColor: locked ? COLOR_LOCKED : selected ? COLOR_SELECTED : COLOR_OPEN,
      extendedProps: { type: 'availability', slotId: slot.id, locked },
    };
  });

  const bookingEvents = (bookings ?? [])
    .filter((b) => b.status === 'Confirmed')
    .map((b) => ({
      id: `booking-${b.id}`,
      start: b.startTime,
      end: b.endTime,
      editable: false,
      display: 'background' as const,
      backgroundColor: COLOR_BOOKED,
      extendedProps: { type: 'booking' },
    }));

  return (
    <div className="min-h-screen bg-[#fcfcfd]">
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
            Open — click to select
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_SELECTED }} />
            Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_LOCKED }} />
            Locked (has a booking)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR_BOOKED }} />
            Booked time
          </span>
        </div>
        {calendarError && <p className="mt-3 text-sm text-amber-600">{calendarError}</p>}

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 fc-light-theme">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={isHourly ? 'timeGridWeek' : 'dayGridMonth'}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
            events={[...availabilityEvents, ...bookingEvents]}
            eventClick={handleEventClick}
            height="auto"
          />
        </div>

        {selectedSlotIds.length > 0 && (
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedSlotIds.length} selected slot(s)?`)) {
                deleteSlotsMutation.mutate(selectedSlotIds);
              }
            }}
            disabled={deleteSlotsMutation.isPending}
            className="mt-3 rounded-full bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
          >
            Delete {selectedSlotIds.length} selected slot{selectedSlotIds.length !== 1 ? 's' : ''}
          </button>
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

      <Footer />
    </div>
  );
}