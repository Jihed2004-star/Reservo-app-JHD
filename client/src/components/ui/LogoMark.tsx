export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#0f172a] via-[#0f172a] to-[#334155] text-white shadow-sm shadow-orange-900/15 shrink-0 ${className}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[62%] w-[62%]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 8l-3 4 3 4" />
        <path d="M12 7l4 10" />
        <path d="M10.5 13.5h5" />
        <path d="M17 9.5l3 2.5-3 2.5" />
      </svg>
    </span>
  );
}

export function LogoWordmark({
  compact = false,
  brand = 'Reservo Marketplace',
  withMark = true,
}: {
  compact?: boolean;
  brand?: string;
  withMark?: boolean;
}) {
  const parts = brand.trim().split(/\s+/);
  const main = parts[0] ?? brand;
  const rest = parts.slice(1).join(' ');
  return (
    <span className="flex items-center gap-2.5 select-none">
      {withMark && <LogoMark className={compact ? 'h-7 w-7' : 'h-8 w-8'} />}
      <span className="font-serif text-[17px] font-bold tracking-tight text-slate-900 leading-none">
        {main}
      </span>
      {rest && (
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold tracking-widest text-white leading-none">
          {rest.toUpperCase()}
        </span>
      )}
    </span>
  );
}
