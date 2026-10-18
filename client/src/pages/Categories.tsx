import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/catalog';
import { CategoryCard } from '../components/cards/CategoryCard';
import { CardSkeletonGrid } from '../components/ui/CardSkeleton';
import Footer from '../components/Footer';

export default function Categories(){
  const [search,setSearch]=useState('');
  const { data: categories, isLoading, error } = useQuery({ queryKey:['categories'], queryFn: getCategories });
  const filtered = useMemo(()=>{
    if(!categories) return [];
    const q=search.trim().toLowerCase();
    if(!q) return categories;
    return categories.filter(c=> c.name.toLowerCase().includes(q) || (c.description??'').toLowerCase().includes(q));
  },[categories,search]);
  return (
    <div className="bg-[#fcfcfd] min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <div className="grid lg:grid-cols-[1.1fr_.9fr]">
            <div className="p-8 sm:p-10">
              <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-bold tracking-widest text-white">MARKETPLACE</span>
              <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Browse categories</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Pick a category to see services and bookable elements. Every listing has live availability — no waiting on replies.</p>
              <div className="relative mt-6 max-w-md">
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" strokeLinecap="round"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search categories, e.g. Beauty, Fitness..." className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"/>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">{categories?.length ?? 0} categories</span>
                <span>Curated & verified providers</span>
              </div>
            </div>
            <div className="relative hidden h-full min-h-[280px] bg-slate-100 lg:block">
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80&auto=format&fit=crop" alt="" className="h-full w-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent lg:from-white/80"/>
              <div className="absolute bottom-4 left-4 rounded-2xl bg-white p-3 shadow-xl">
                <div className="text-xs font-bold text-slate-900">Live availability</div>
                <div className="text-xs text-slate-500">Updated every booking</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          {isLoading && <CardSkeletonGrid count={6} />}
          {error && (<div className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-10 text-center"><p className="font-semibold text-rose-700">Could not load categories</p></div>)}
          {!isLoading && !error && filtered.length===0 && (<div className="rounded-[22px] border border-slate-200 bg-white px-6 py-16 text-center"><p className="font-semibold text-slate-900">{search ? 'No categories match your search' : 'No categories yet'}</p></div>)}
          {!isLoading && !error && filtered.length>0 && (<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(c=> <CategoryCard key={c.id} category={c} />)}</div>)}
        </div>
      </div>
      <Footer/>
    </div>
  );
}
