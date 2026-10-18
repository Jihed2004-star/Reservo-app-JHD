import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import Footer from '../components/Footer';
import { getElementImage } from '../utils/images';
import '../index.css';

export default function ElementDetail(){
  const { id } = useParams<{id:string}>();
  const { user } = useAuth();
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
    if(info.allDay){ setStartTime(`${info.startStr}T00:00:00.000Z`); setEndTime(`${info.endStr}T00:00:00.000Z`); }
    else { setStartTime(info.start.toISOString()); setEndTime(info.end.toISOString()); }
    setBookingSuccess(false); setBookingError(null);
  }
  function handleClear(){ setStartTime(''); setEndTime(''); setBookingSuccess(false); setBookingError(null); }
  if(isLoading){
    return (<div className="min-h-screen bg-[#fcfcfd]"><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="h-64 animate-pulse rounded-[28px] bg-slate-100"/></div><Footer/></div>);
  }
  if(error || !element){
    return (<div className="min-h-screen bg-[#fcfcfd]"><div className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-10 text-center"><p className="font-semibold text-rose-700">{error?"Could not load this element":"Element not found"}</p></div></div><Footer/></div>);
  }
  const availabilityEvents = (slots ?? []).map(s=> ({ id:s.id, title:'Available', start:s.startTime, end:s.endTime, backgroundColor:'#4f46e5', borderColor:'#4f46e5', display:'block' } as any));
  const bookedEvents = (bookedRanges ?? []).map((b,i)=> ({ id:`booked-${i}`, title:'Booked', start:b.startTime, end:b.endTime, backgroundColor:'#f43f5e', borderColor:'#f43f5e', display:'background' } as any));
  const isHourly = element.bookingUnit==='Hourly';
  return (
    <div className="min-h-screen bg-[#fcfcfd]">
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
              <img src={getElementImage(element.name, element.id)} alt={element.name} className="h-full w-full object-cover"/>
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
                <div className="rounded-2xl bg-slate-50 px-3 py-3"><div className="text-xs font-bold uppercase tracking-widest text-slate-400">Available</div><div className="mt-1 text-sm font-bold text-slate-900">{slots?.length ?? 0} slots</div></div>
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
            <div className="mt-3 rounded-[22px] border border-slate-200 bg-white p-3 fc-light-theme">
              <FullCalendar plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]} initialView={isHourly?'timeGridWeek':'dayGridMonth'} headerToolbar={{left:'prev,next today',center:'title',right:''}} events={[...availabilityEvents, ...bookedEvents]} selectable select={handleSelect} selectMirror height="auto" />
            </div>
          </div>

          <div className="lg:sticky lg:top-[72px] h-fit">
            <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-sm font-bold text-slate-900">Book this element</h3>
              {!user ? (
                <p className="mt-3 text-sm text-slate-500"><Link to="/login" className="font-semibold text-slate-900 underline">Sign in</Link> to book this element. Instant confirmation after you pick a time.</p>
              ) : (
                <>
                  {startTime && endTime ? (
                    <div className="mt-4 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-white">
                      <div className="text-xs font-bold uppercase tracking-widest text-white/60">Selected time</div>
                      <div className="mt-1 text-sm font-semibold">{new Date(startTime).toLocaleString()} → {new Date(endTime).toLocaleString()}</div>
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
                {[0,1,2].map(i=> <img key={i} src={getElementImage(element.name, element.id+i)} alt="" className="h-20 w-full rounded-xl object-cover"/> )}
              </div>
              <p className="mt-2 text-xs text-slate-400">Curated Unsplash imagery — stable per element.</p>
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
      <Footer/>
    </div>
  );
}
