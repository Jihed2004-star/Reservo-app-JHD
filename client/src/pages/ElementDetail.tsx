import { useState } from 'react';
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
import { elementImage, resolveImageUrl } from '../utils/images';
import '../index.css';

// Availability and reservations are drawn as background washes. Full-opacity
// pastels are used because the stock --fc-bg-event-opacity of 0.3 washes the
// colour out to the point where the grid looks empty.
const COLOR_AVAILABLE = '#e0e7ff'; // indigo-100
const COLOR_BOOKED = '#fecdd3'; // rose-200

// dayGridMonth silently drops background events that carry a time of day, so
// every non-hourly range has to be expressed as an all-day range. Plain
// YYYY-MM-DD strings are required as well: a UTC midnight timestamp shifts the
// block onto the previous day in negative offsets.
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

function formatRange(start?: string, end?: string, allDay = false): string {
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

export default function ElementDetail(){
  const { id } = useParams<{id:string}>();
  const { user } = useAuth();
  const location = useLocation();
  const qc = useQueryClient();
  const [startTime,setStartTime]=useState('');
  const [endTime,setEndTime]=useState('');
  const [bookingError,setBookingError]=useState<string|null>(null);
  const [bookingSuccess,setBookingSuccess]=useState(false);
  const { data: element, isLoading, error } = useQuery({ queryKey:['element',id], queryFn: ()=> getElementById(id!), enabled: !!id });
  const { data: slots } = useQuery({ queryKey:['availability',id], queryFn: ()=> getAvailability(id!), enabled: !!id });
  const { data: bookedRanges } = useQuery({ queryKey:['bookedRanges',id], queryFn: ()=> getBookedRanges(id!), enabled: !!id });
  const { data: reviews } = useQuery({ queryKey:['reviews',id], queryFn: ()=> getReviewsByElement(id!), enabled: !!id });
  const { data: ratingSummary } = useQuery({ queryKey:['ratingSummary',id], queryFn: ()=> getRatingSummary(id!), enabled: !!id });
  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: ()=>{ setBookingSuccess(true); setBookingError(null); qc.invalidateQueries({queryKey:['availability',id]}); qc.invalidateQueries({queryKey:['bookedRanges',id]}); },
    onError: (err:any)=>{ setBookingError(err?.response?.data?.message ?? 'Could not create booking.'); setBookingSuccess(false); }
  });
  function handleBook(){ if(!id||!startTime||!endTime) return; setBookingSuccess(false); bookingMutation.mutate({ elementId:id, startTime, endTime }); }
  function handleSelect(info: DateSelectArg){
    if(info.allDay){
      setStartTime(`${info.startStr}T00:00:00.000Z`);
      setEndTime(`${info.endStr}T00:00:00.000Z`);
    } else {
      setStartTime(info.start.toISOString());
      setEndTime(info.end.toISOString());
    }
    setBookingSuccess(false); setBookingError(null);
  }
  function handleClear(){ setStartTime(''); setEndTime(''); setBookingSuccess(false); setBookingError(null); }
  if(isLoading){
    return (<div className="min-h-screen bg-[#f8fafc]"><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="h-64 animate-pulse rounded-[28px] bg-slate-100"/></div></div>);
  }
  if(error || !element){
    return (<div className="min-h-screen bg-[#f8fafc]"><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-10 text-center"><p className="font-semibold text-rose-700">{error?"Could not load this element":"Element not found"}</p></div></div></div>);
  }
  const isHourly = element.bookingUnit==='Hourly';
  // Hourly elements stay on a time grid, where a timed background event renders
  // correctly. Daily/Monthly elements switch to a month grid, which only draws
  // all-day background events - a timed one is dropped without any warning.
  const toCalendarRange = (start:string, end:string) => (isHourly ? { start, end } : toAllDayRange(start, end));
  // The availability feed still contains ranges that have since been booked, so
  // drop those overlaps - otherwise a reserved day is also counted (and drawn)
  // as available.
  const overlapsBooked = (start:string, end:string) =>
    (bookedRanges ?? []).some(b=> start < b.endTime && b.startTime < end);

  const availabilityEvents = (slots ?? []).flatMap((slot) => {
    const openIntervals = isHourly
      ? computeOpenIntervals(slot, bookedRanges ?? [])
      : overlapsBooked(slot.startTime, slot.endTime)
      ? []
      : [{ start: slot.startTime, end: slot.endTime }];

    return openIntervals.map((interval, idx) => ({
      id: `avail-${slot.id}-${idx}`,
      groupId: 'available',
      ...toCalendarRange(interval.start, interval.end),
      allDay: !isHourly,
      backgroundColor: COLOR_AVAILABLE,
      display: 'background' as const,
      extendedProps: { kind: 'available' },
    }));
  });
  const bookedEvents = (bookedRanges ?? []).map((b,i)=> ({
    id:`booked-${i}`,
    ...toCalendarRange(b.startTime, b.endTime),
    allDay: !isHourly,
    backgroundColor: COLOR_BOOKED,
    display: 'background' as const,
    extendedProps: { kind: 'booked' },
  }));
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* breadcrumb */}
        <Link to="/categories" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Explore
        </Link>
        {/* hero */}
        <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="relative h-64 lg:h-auto min-h-[320px]">
              <img src={elementImage(element)} alt={element.name} className="h-full w-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-white/0"/>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <StatusBadge isActive={element.isActive} />
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">{element.bookingUnit}</span>
                {ratingSummary && ratingSummary.reviewCount>0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow">★ {ratingSummary.averageRating.toFixed(1)} · {ratingSummary.reviewCount} reviews</span>
                )}
              </div>
            </div>
            <div className="p-7 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{element.name}</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Pick a time on the calendar below. Your selection is validated live against provider availability — no double bookings.</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-2xl font-extrabold text-slate-900">${Number(element.price).toFixed(2)}</div>
                  <div className="text-xs font-medium text-slate-400">per {element.bookingUnit.toLowerCase()} unit</div>
                </div>
              </div>
              {Object.keys(element.attributes).length>0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {Object.entries(element.attributes).slice(0,6).map(([k,v])=> (
                    <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"><TagIcon className="h-3.5 w-3.5 text-slate-400"/>{v}</span>
                  ))}
                </div>
              )}
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-slate-50 px-3 py-3"><div className="text-xs font-bold uppercase tracking-widest text-slate-400">Available</div><div className="mt-1 text-sm font-bold text-slate-900">{availabilityEvents.length} slots</div></div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3"><div className="text-xs font-bold uppercase tracking-widest text-slate-400">Pricing</div><div className="mt-1 text-sm font-bold text-slate-900">Instant confirm</div></div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3"><div className="text-xs font-bold uppercase tracking-widest text-slate-400">Support</div><div className="mt-1 text-sm font-bold text-slate-900">7d help</div></div>
              </div>
              {/* trust */}
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">✓</span>
                Coverage-checked booking — server validates every range against existing bookings.
              </div>
            </div>
          </div>
        </div>

        {/* calendar + booking */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_.9fr]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">Availability</h2>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">{isHourly ? 'Hourly' : 'Daily/Monthly'} · drag to select</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700"><span className="h-2 w-2 rounded-full bg-indigo-600"/> Available</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-semibold text-rose-700"><span className="h-2 w-2 rounded-full bg-rose-500"/> Booked</span>
            </div>
            <div className="mt-3 rounded-[22px] border border-slate-200 bg-white p-3 fc-light-theme fc-availability-calendar">
              <FullCalendar
                plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
                initialView={isHourly?'timeGridWeek':'dayGridMonth'}
                allDaySlot={!isHourly}
                slotDuration={isHourly ? '01:00:00' : undefined}
                snapDuration={isHourly ? '01:00:00' : undefined}
                selectConstraint="available"
                headerToolbar={{left:'prev,next today',center:'title',right:''}}
                events={[...availabilityEvents, ...bookedEvents]}
                selectable
                select={handleSelect}
                selectMirror
                eventDidMount={(info)=>{
                  const kind = (info.event.extendedProps || {}).kind;
                  const range = formatRange(info.event.startStr, info.event.endStr, info.event.allDay);
                  if (range) info.el.title = `${kind==='booked' ? 'Reserved' : 'Available'}: ${range}`;
                }}
                height="auto"
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-[72px] h-fit">
            <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-slate-900">Book this element</h3>
              {!user ? (
                <p className="mt-3 text-sm text-slate-500"><Link to="/login" state={{ from: location.pathname + location.search }} className="font-semibold text-slate-900 underline">Sign in</Link> to book this element. Instant confirmation after you pick a time.</p>
              ) : (
                <>
                  {startTime && endTime ? (
                    <div className="mt-4 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-white">
                      <div className="text-xs font-bold uppercase tracking-widest text-white/60">Selected time</div>
                      <div className="mt-1 text-sm font-semibold">
                        {isHourly
                          ? `${new Date(startTime).toLocaleString()} → ${new Date(endTime).toLocaleString()}`
                          : formatRange(startTime, endTime, true)}
                      </div>
                      <button onClick={handleClear} className="mt-2 text-xs font-semibold text-indigo-200 hover:text-white">Clear selection</button>
                    </div>
                  ) : (
                    <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">Drag on the calendar to select a time range. We will check coverage live.</p>
                  )}
                  <button onClick={handleBook} disabled={bookingMutation.isPending || !startTime || !endTime} className="mt-4 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-50">
                    {bookingMutation.isPending ? 'Booking…' : 'Confirm booking'}
                  </button>
                  {bookingError && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{bookingError}</p>}
                  {bookingSuccess && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Booking confirmed! Check My Bookings.</p>}
                  <p className="mt-3 text-xs leading-5 text-slate-400">By confirming you agree to provider terms. Free cancellation until the provider\\'s cutoff (if available).</p>
                </>
              )}
            </div>
            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Images</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(element.images && element.images.length > 0
                  ? element.images.map((image) => resolveImageUrl(image.url) ?? '')
                  : [0, 1, 2].map((i) => elementImage({ ...element, id: element.id + i }))
                ).map((url, index) => (
                  <img key={`${url}-${index}`} src={url} alt="" className="h-20 w-full rounded-xl object-cover" />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {element.images && element.images.length > 0
                  ? 'Photos uploaded by the provider.'
                  : 'Curated Unsplash imagery — stable per element.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-slate-900">Reviews {reviews && reviews.length>0 && `(${reviews.length})`}</h2>
          {ratingSummary && ratingSummary.reviewCount>0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm">
              <span className="text-amber-400">★★★★★</span>
              <span className="font-bold text-slate-900">{ratingSummary.averageRating.toFixed(1)}</span>
              <span className="text-slate-500">· {ratingSummary.reviewCount} reviews</span>
            </div>
          )}
          {reviews && reviews.length===0 && <p className="mt-3 text-sm text-slate-500">No reviews yet. Be the first to book and leave one.</p>}
          <ul className="mt-4 space-y-3">
            {reviews?.map((r:any)=> (
              <li key={r.id} className="rounded-[16px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">{r.reviewerName}</p><span className="text-sm text-amber-400">{'★'.repeat(r.rating)}<span className="text-slate-200">{'★'.repeat(5-r.rating)}</span></span></div>
                {r.comment && <p className="mt-1.5 text-sm text-slate-600">{r.comment}</p>}
                <p className="mt-1 text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
