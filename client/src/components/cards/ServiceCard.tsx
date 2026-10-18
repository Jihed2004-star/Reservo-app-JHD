import type { Service } from '../../types/catalog';
import { Card } from '../ui/Card';
import { Badge, StatusBadge } from '../ui/Badge';
import { getServiceImage } from '../../utils/images';

interface ServiceCardProps {
  service: Service;
}

const UNIT_LABEL: Record<Service['bookingUnit'], string> = {
  Hourly: 'Booked by hour',
  Daily: 'Booked by day',
  Monthly: 'Booked by month',
};

export function ServiceCard({ service }: ServiceCardProps) {
  const elementCount = service.elements.length;

  return (
    <Card
      imageUrl={getServiceImage(service.name, service.id)}
      imageAlt={service.name}
      cornerBadge={<StatusBadge isActive={service.isActive} />}
      footerLabel="View elements"
      footerTo={`/services/${service.id}`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-indigo-600">
        {service.categoryName}
      </span>
      <h3 className="mt-1 text-lg font-bold text-slate-900">{service.name}</h3>
      {service.description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {service.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="completed">
          {elementCount} {elementCount === 1 ? 'element' : 'elements'}
        </Badge>
        <Badge variant="completed">{UNIT_LABEL[service.bookingUnit]}</Badge>
      </div>
    </Card>
  );
}
