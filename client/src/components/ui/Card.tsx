import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  imageUrl?: string | null;
  imageAlt: string;
  cornerBadge?: ReactNode;
  children: ReactNode;
  footerLabel: string;
  footerTo?: string;
  onFooterClick?: () => void;
}

export function Card({ imageUrl, imageAlt, cornerBadge, children, footerLabel, footerTo, onFooterClick }: CardProps) {
  const footerButton = (
    <button type="button" onClick={onFooterClick} className="group/btn inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-black">
      {footerLabel}
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 transition group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );
  return (
    <div className="card-hover flex h-full flex-col overflow-hidden rounded-[22px] border border-slate-200/70 bg-white">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <svg className="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-5-4 4-2-2-5 5"/></svg>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        {cornerBadge && <div className="absolute right-3 top-3 backdrop-blur"> {cornerBadge} </div>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex-1"> {children} </div>
        {footerTo ? <Link to={footerTo} className="block"> {footerButton} </Link> : footerButton}
      </div>
    </div>
  );
}
