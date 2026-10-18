import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from './ui/LogoMark';

interface AuthLayoutProps {
  illustrationSide: 'left' | 'right';
  children: ReactNode;
}

function BookingIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl bg-[#F1F2FA]">
      {/* soft decorative blobs */}
      <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-[#E0E4FB]" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[#FDE9E6] opacity-70" />

      <svg viewBox="0 0 340 340" className="relative w-3/4 max-w-sm drop-shadow-xl">
        {/* calendar card */}
        <rect x="50" y="60" width="240" height="220" rx="20" fill="white" stroke="#E5E7EB" strokeWidth="2" />
        <rect x="50" y="60" width="240" height="56" rx="20" fill="#4F46E5" />
        <rect x="50" y="96" width="240" height="20" fill="#4F46E5" />
        <circle cx="90" cy="88" r="6" fill="#C7D2FE" />
        <circle cx="250" cy="88" r="6" fill="#C7D2FE" />

        {/* grid dots representing days */}
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 6 }).map((_, col) => {
            const x = 78 + col * 32;
            const y = 148 + row * 30;
            const isHighlighted = row === 1 && col === 3;
            return (
              <rect
                key={`${row}-${col}`}
                x={x}
                y={y}
                width="20"
                height="20"
                rx="5"
                fill={isHighlighted ? '#FB7185' : '#EEF0FA'}
              />
            );
          })
        )}

        {/* floating clock badge */}
        <g transform="translate(230, 220)">
          <circle cx="0" cy="0" r="34" fill="white" stroke="#E5E7EB" strokeWidth="2" />
          <circle cx="0" cy="0" r="24" fill="#FDE9E6" />
          <path d="M0 -14V0L10 8" stroke="#FB7185" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* floating check badge */}
        <g transform="translate(60, 250)">
          <circle cx="0" cy="0" r="26" fill="white" stroke="#E5E7EB" strokeWidth="2" />
          <circle cx="0" cy="0" r="18" fill="#DCFCE7" />
          <path d="M-7 0L-2 6L8 -6" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

export default function AuthLayout({ illustrationSide, children }: AuthLayoutProps) {
  const form = (
    <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-16">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );

  const illustration = (
    <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-10">
      <div className="w-full h-[520px]">
        <BookingIllustration />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-6 pt-8 lg:px-16">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <LogoMark className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold text-slate-900 tracking-tight">Reservo</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {illustrationSide === 'left' ? (
          <>
            {illustration}
            {form}
          </>
        ) : (
          <>
            {form}
            {illustration}
          </>
        )}
      </div>
    </div>
  );
}