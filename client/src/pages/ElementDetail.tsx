import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getElementById, getAvailability, getBookedRanges, createBooking } from '../api/elements';
import { getReviewsByElement, getRatingSummary } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg } from '@fullcalendar/core';
import { StatusBadge } from '../components/ui/Badge';
import { TagIcon } from '../components/ui/TagIcon';
import { CardSkeletonGrid } from '../components/ui/CardSkeleton';
import Footer from '../components/Footer';
import '../index.css';

export default function ElementDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Restore any pending booking selected before login
  useEffect(() => {
    if (!id) return;
    try {
      const saved = sessionStorage.getItem('pending_booking');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.elementId === id && parsed.startTime && parsed.endTime) {
          setStartTime(parsed.startTime);
          setEndTime(parsed.endTime);
        }
      }
    } catch {
      // ignore parsing error
    }
  }, [id]);

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

  const { data: bookedRanges } = useQuery({
    queryKey: ['bookedRanges', id],
    queryFn: () => getBookedRanges(id!),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => getReviewsByElement(id!),
    enabled: !!id,
  });

  const { data: ratingSummary } = useQuery({
    queryKey: ['ratingSummary', id],
    queryFn: () => getRatingSummary(id!),
    enabled: !!id,
  });

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      setBookingSuccess(true);
      setBookingError(null);
      sessionStorage.removeItem('pending_booking');
      queryClient.invalidateQueries({ queryKey: ['availability', id] });
      queryClient.invalidateQueries({ queryKey: ['bookedRanges', id] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? 'Could not create booking.';
      setBookingError(message);
      setBookingSuccess(false);
    },
  });

  function handleBook() {
    if (!id || !startTime || !endTime) return;
    setBookingSuccess(false);
    bookingMutation.mutate({
      elementId: id,
      startTime,
      endTime,
    });
  }

  function handleSelect(info: DateSelectArg) {
    let start = '';
    let end = '';
    if (info.allDay) {
      start = `${info.startStr}T00:00:00.000Z`;
      end = `${info.endStr}T00:00:00.000Z`;
    } else {
      start = info.start.toISOString();
      end = info.end.toISOString();
    }

    setStartTime(start);
    setEndTime(end);
    setBookingSuccess(false);
    setBookingError(null);

    // Save pending booking so it survives login/redirect
    if (id) {
      sessionStorage.setItem(
        'pending_booking',
        JSON.stringify({
          elementId: id,
          startTime: start,
          endTime: end,
        })
      );
    }
  }

  function handleClearSelection() {
    setStartTime('');
    setEndTime('');
    setBookingSuccess(false);
    setBookingError(null);
    sessionStorage.removeItem('pending_booking');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-8 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-8">
            <CardSkeletonGrid count={2} />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !element) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
            <p className="font-semibold text-rose-700">
              {error ? "Couldn't load this element" : 'Element not found'}
            </p>
            <p className="mt-1 text-sm text-rose-500">
              {error
                ? 'Something went wrong on our end — try refreshing the page.'
                : "This element doesn't exist or may have been removed."}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const attributeEntries = Object.entries(element.attributes);
  const unitSuffix =
    element.bookingUnit === 'Hourly'
      ? 'per hour'
      : element.bookingUnit === 'Daily'
      ? 'per day'
      : 'per month';

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          to={`/services/${element.serviceId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to service
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{element.name}</h1>
          <StatusBadge isActive={element.isActive} />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <p className="text-2xl font-bold text-indigo-600">
            ${element.price.toFixed(2)}{' '}
            <span className="text-sm font-normal text-slate-400">{unitSuffix}</span>
          </p>
          {ratingSummary && ratingSummary.reviewCount > 0 && (
            <span className="flex items-center gap-1 text-sm text-slate-600">
              <span className="text-amber-400">★</span>
              <span className="font-medium">{ratingSummary.averageRating}</span>
              <span className="text-slate-400">({ratingSummary.reviewCount})</span>
            </span>
          )}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <svg className="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="M21 15l-5-5-4 4-2-2-5 5" />
              </svg>
            </div>

            {attributeEntries.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  Details
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {attributeEntries.map(([key, value]) => (
                    <li key={key} className="flex items-center gap-2.5 text-sm">
                      <TagIcon className="h-4 w-4 shrink-0 text-indigo-500" />
                      <span className="text-slate-400">{key}:</span>
                      <span className="text-slate-700">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                Availability
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Booked
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 fc-light-theme">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={element.bookingUnit === 'Hourly' ? 'timeGridWeek' : 'dayGridMonth'}
                selectable={true}
                select={handleSelect}
                events={[
                  ...(slots?.map((slot) => ({
                    id: `avail-${slot.id}`,
                    start: slot.startTime,
                    end: slot.endTime,
                    display: 'background',
                    color: '#818cf8',
                    allDay: element.bookingUnit !== 'Hourly',
                  })) ?? []),
                  ...(bookedRanges?.map((range, i) => ({
                    id: `booked-${i}`,
                    start: range.startTime,
                    end: range.endTime,
                    title: 'Booked',
                    display: 'block',
                    backgroundColor: '#f43f5e',
                    borderColor: '#f43f5e',
                    textColor: '#ffffff',
                    allDay: element.bookingUnit !== 'Hourly',
                  })) ?? []),
                ]}
                height="auto"
              />
            </div>

            {user ? (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  Book this element
                </h2>

                {startTime && endTime ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <div className="text-sm">
                      <p className="font-medium text-indigo-900">Selected time</p>
                      <p className="text-indigo-600">
                        {new Date(startTime).toLocaleString()} — {new Date(endTime).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={handleClearSelection}
                      className="shrink-0 text-xs font-medium text-indigo-500 hover:text-indigo-700"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Drag on the calendar above to select a time.
                  </p>
                )}

                <button
                  onClick={handleBook}
                  disabled={bookingMutation.isPending || !startTime || !endTime}
                  className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {bookingMutation.isPending ? 'Booking...' : 'Book'}
                </button>

                {bookingError && (
                  <p className="mt-3 text-sm text-amber-600">{bookingError}</p>
                )}
                {bookingSuccess && (
                  <p className="mt-3 text-sm text-emerald-600">Booking confirmed!</p>
                )}
              </div>
            ) : (
              <div className="mt-6 border-t border-slate-200 pt-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  Book this element
                </h2>

                {startTime && endTime ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <div className="text-sm">
                      <p className="font-medium text-indigo-900">Selected time</p>
                      <p className="text-indigo-600">
                        {new Date(startTime).toLocaleString()} — {new Date(endTime).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={handleClearSelection}
                      className="shrink-0 text-xs font-medium text-indigo-500 hover:text-indigo-700"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Select an open time slot on the calendar above, then log in to reserve it.
                  </p>
                )}

                <Link
                  to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                  state={{ from: location.pathname }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 shadow-sm"
                >
                  Log in to book
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            Reviews {reviews && reviews.length > 0 && `(${reviews.length})`}
          </h2>

          {reviews && reviews.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">No reviews yet.</p>
          )}

          <ul className="mt-4 space-y-4">
            {reviews?.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{r.reviewerName}</p>
                  <span className="text-amber-400 text-sm">
                    {'★'.repeat(r.rating)}
                    <span className="text-slate-200">{'★'.repeat(5 - r.rating)}</span>
                  </span>
                </div>
                {r.comment && <p className="mt-1.5 text-sm text-slate-600">{r.comment}</p>}
                <p className="mt-1.5 text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
}