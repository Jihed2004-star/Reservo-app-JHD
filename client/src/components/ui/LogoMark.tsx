import bookingLogo from '../../assets/booking.png';

interface LogoMarkProps {
  className?: string;
  alt?: string;
}

export function LogoMark({ className = 'h-7 w-7 object-contain', alt = 'Reservo Logo' }: LogoMarkProps) {
  return (
    <img
      src={bookingLogo}
      alt={alt}
      className={className}
    />
  );
}
