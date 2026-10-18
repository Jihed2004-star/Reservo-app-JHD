import type { Category } from '../../types/catalog';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { getCategoryImage } from '../../utils/images';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Card
      imageUrl={getCategoryImage(category.name, category.id)}
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
    </Card>
  );
}