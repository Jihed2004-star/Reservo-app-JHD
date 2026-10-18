import type { ReactNode } from 'react';
export type BadgeVariant = 'active'|'inactive'|'confirmed'|'cancelled'|'completed';
const VARIANT_STYLES: Record<BadgeVariant,string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 ring-slate-200',
  confirmed: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  cancelled: 'bg-rose-50 text-rose-600 ring-rose-200',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200',
};
interface BadgeProps { variant: BadgeVariant; children: ReactNode; }
export function Badge({ variant, children }: BadgeProps){
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${VARIANT_STYLES[variant]}`}>{children}</span>;
}
export function StatusBadge({ isActive }: { isActive: boolean }){
  return <Badge variant={isActive?'active':'inactive'}>{isActive?'Active':'Inactive'}</Badge>;
}
const KNOWN: BadgeVariant[]=['confirmed','cancelled','completed'];
export function statusToVariant(status:string): BadgeVariant{
  const lower=status.toLowerCase();
  return (KNOWN as string[]).includes(lower) ? (lower as BadgeVariant) : 'inactive';
}
