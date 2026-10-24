import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getCategories, getServices } from '../api/catalog';
import { ServiceCard } from '../components/cards/ServiceCard';
import { CardSkeletonGrid } from '../components/ui/CardSkeleton';
import { categoryImage, getCategoryImage } from '../utils/images';

const DEFAULT_HERO_IMAGE = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop';

export default function Services(){
  const { categoryId } = useParams<{categoryId:string}>();
  const [search,setSearch]=useState('');
  const { data: services, isLoading, error } = useQuery({ queryKey:['services',categoryId], queryFn: ()=> getServices(categoryId), enabled: !!categoryId });
  const { data: categories } = useQuery({ queryKey:['categories'], queryFn: getCategories });
  const filtered = useMemo(()=>{
    if(!services) return [];
    const q=search.trim().toLowerCase();
    if(!q) return services;
    return services.filter(s=> s.name.toLowerCase().includes(q));
  },[services,search]);
  const category = categories?.find(c=> c.id === categoryId);
  const categoryName = category?.name ?? services?.[0]?.categoryName;
  const heroImg = category
    ? categoryImage(category)
    : categoryName
      ? getCategoryImage(categoryName, categoryId)
      : DEFAULT_HERO_IMAGE;
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Link to="/categories" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          All categories
        </Link>
        <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <div className="grid lg:grid-cols-[1.1fr_.9fr]">
            <div className="p-8 sm:p-10">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">{categoryName ?? 'Category'}</span>
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{categoryName ?? 'Services'}</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Pick a service to explore its bookable elements. Each one has its own calendar and pricing.</p>
              <div className="relative mt-6 max-w-md">
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" strokeLinecap="round"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search services..." className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"/>
              </div>
            </div>
            <div className="relative hidden min-h-[260px] lg:block">
              <img src={heroImg} alt="" className="h-full w-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent"/>
            </div>
          </div>
        </div>
        <div className="mt-8">
          {isLoading && <CardSkeletonGrid count={6} />}
          {error && (<div className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-10 text-center"><p className="font-semibold text-rose-700">Could not load services</p></div>)}
          {!isLoading && !error && filtered.length===0 && (<div className="rounded-[22px] border border-slate-200 bg-white px-6 py-16 text-center"><p className="font-semibold text-slate-900">{search?'No services match your search':'No services in this category yet'}</p></div>)}
          {!isLoading && !error && filtered.length>0 && (<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(s=> <ServiceCard key={s.id} service={s}/>)}</div>)}
        </div>
      </div>
    </div>
  );
}
