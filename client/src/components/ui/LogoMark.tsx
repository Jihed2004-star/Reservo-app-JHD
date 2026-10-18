export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shadow-slate-900/10 ${className}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.2" y="5" width="17.6" height="14.2" rx="3" />
        <path d="M7.2 3.8v2.8M16.8 3.8v2.8" />
        <path d="M3.2 9.2h17.6" strokeWidth="1.6" />
        <path d="M9 14.2l1.7 1.7 4.2-3.9" strokeWidth="1.9" />
      </svg>
    </span>
  );
}
export function LogoWordmark({ compact=false }: { compact?: boolean }){
  return (
    <span className="flex items-center gap-2">
      <LogoMark className={compact? 'h-7 w-7':'h-8 w-8'} />
      <span className="leading-none">
        <span className="font-display text-[16px] font-extrabold tracking-tight text-slate-900">Reservo</span>
        {!compact && <span className="ml-1.5 hidden sm:inline-flex rounded-full bg-slate-900 px-1.5 py-0.5 align-middle text-[9px] font-bold tracking-widest text-white">MARKETPLACE</span>}
      </span>
    </span>
  );
}
