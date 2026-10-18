import type { ElementItem } from '../../types/catalog';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { TagIcon } from '../ui/TagIcon';
import { getElementImage } from '../../utils/images';

interface ElementCardProps {
  element: ElementItem;
  /** Optional — Element itself has no serviceName field; pass it down if the
   *  page has it available (e.g. from ServiceDetail's already-loaded Service). */
  serviceName?: string;
  maxAttributesShown?: number;
}

const UNIT_SUFFIX: Record<ElementItem['bookingUnit'], string> = {
  Hourly: 'per unit',
  Daily: 'per day',
  Monthly: 'per month',
};

export function ElementCard({
  element,
  serviceName,
  maxAttributesShown = 3,
}: ElementCardProps) {
  const attributeEntries = Object.entries(element.attributes);
  const shown = attributeEntries.slice(0, maxAttributesShown);
  const hiddenCount = attributeEntries.length - shown.length;

  return (
    <Card
      imageUrl={getElementImage(element.name, element.id)}
      imageAlt={element.name}
      cornerBadge={<StatusBadge isActive={element.isActive} />}
      footerLabel="View details"
      footerTo={`/elements/${element.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          {serviceName && (
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {serviceName}
            </span>
          )}
          <h3 className="text-lg font-bold text-slate-900">{element.name}</h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-indigo-600">
            ${element.price.toFixed(2)}
          </div>
          <div className="text-xs text-slate-400">
            {UNIT_SUFFIX[element.bookingUnit]}
          </div>
        </div>
      </div>

      {shown.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {shown.map(([key, value]) => (
            <span
              key={key}
              className="flex items-center gap-1.5 text-sm text-slate-500"
            >
              <TagIcon className="h-4 w-4 text-slate-400" />
              {value}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="text-sm text-slate-400">+{hiddenCount} more</span>
          )}
        </div>
      )}
    </Card>
  );
}
