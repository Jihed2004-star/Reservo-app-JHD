import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getServiceById } from '../api/catalog';
import { ElementCard } from '../components/cards/ElementCard';
import { StatusBadge } from '../components/ui/Badge';
import { CardSkeletonGrid } from '../components/ui/CardSkeleton';
import Footer from '../components/Footer';
import { getServiceImage } from '../utils/images';

export default function ServiceDetail(){
  const { id } = useParams<{id:string}>();
  const [search,setSearch]=useState('');
  const { data: service, isLoading, error } = useQuery({ queryKey:['service',id], queryFn: ()=> getServiceById(id!), enabled: !!id });
  const filtered = useMemo(()=>{
    if(!service) return [];
    const q=search.trim().toLowerCase();
    if(!q) return service.elements;
    return service.elements.filter(el=> el.name.toLowerCase().includes(q));
  },[service,search]);
  if(isLoading){
    return (<div className="min-h-screen bg-[#fcfcfd]"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><div className="h-4 w-40 animate-pulse rounded bg-slate-100"/><div className="mt-4 h-8 w-64 animate-pulse rounded bg-slate-100"/><div className="mt-8"><CardSkeletonGrid count={3}/></div></div><Footer/></div>);
  }
  if(error || !service){
    return (<div className="min-h-screen bg-[#fcfcfd]"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><div className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-10 text-center"><p className="font-semibold text-rose-700">{error ? "Could not load this service" : 'Service not found'}</p></div></div><Footer/></div>);
  }
  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Link to={`/categories/${service.categoryId}/services`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to {service.categoryName}
        </Link>
        <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <div className="grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="p-8 sm:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold tracking-widest text-indigo-600">{service.categoryName}</span>
                <StatusBadge isActive={service.isActive} />
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">{service.bookingUnit}</span>
              </div>
              <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{service.name}</h1>
              {service.description && <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{service.description}</p>}
              <div className="mt-6 flex gap-2 text-xs">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700">{service.elements.length} elements</span>
                <span className="rounded-full bg-slate-900 px-3 py-1.5 font-semibold text-white">Live calendar per element</span>
              </div>
            </div>
            <div className="relative hidden min-h-[280px] lg:block">
              <img src={getServiceImage(service.name, service.id)} alt={service.name} className="h-full w-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent"/>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">Elements</h2>
          <div className="relative w-full sm:w-72">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" strokeLinecap="round"/></svg>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search elements..." className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"/>
          </div>
        </div>
        <div className="mt-6">
          {filtered.length===0 && (<div className="rounded-[22px] border border-slate-200 bg-white px-6 py-16 text-center"><p className="font-semibold text-slate-900">{search?'No elements match your search':'No elements listed yet'}</p></div>)}
          {filtered.length>0 && (<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(el=> <ElementCard key={el.id} element={el} serviceName={service.name} />)}</div>)}
        </div>
      </div>
      <Footer/>
    </div>
  );
}
