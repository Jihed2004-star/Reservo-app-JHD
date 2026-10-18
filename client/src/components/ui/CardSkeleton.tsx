export function CardSkeleton(){
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
      <div className="h-48 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-9 w-full animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}
export function CardSkeletonGrid({ count=6 }: {count?:number}){
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:count}).map((_,i)=><CardSkeleton key={i}/>)}</div>;
}
