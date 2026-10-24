import type { Category } from '../../types/catalog';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { categoryImage } from '../../utils/images';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const hasPrice = category.minPrice != null || category.maxPrice != null;
  const priceLabel = hasPrice
    ? category.minPrice != null && category.maxPrice != null && category.minPrice !== category.maxPrice
      ? `$${Number(category.minPrice).toFixed(0)} – $${Number(category.maxPrice).toFixed(0)}`
      : `$${Number(category.minPrice ?? category.maxPrice).toFixed(0)}`
    : 'No pricing yet';
  const ratingLabel = category.averageRating != null ? `${Number(category.averageRating).toFixed(1)} ★` : '—';
  return (
    <Card
      imageUrl={categoryImage(category)}
      imageAlt={category.name}
      cornerBadge={<StatusBadge isActive={category.isActive} />}
      footerLabel="Browse services"
      footerTo={`/categories/${category.id}/services`}
    >
      <h3 className="font-display text-[17px] font-bold leading-tight text-slate-900">{category.name}</h3>
      {category.description && (
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-slate-500">
          {category.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
          <span className="text-amber-500">★</span> {ratingLabel}
          <span className="font-normal text-amber-600/80">({category.reviewCount ?? 0})</span>
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          {priceLabel}
        </span>
      </div>
    </Card>
  );
}