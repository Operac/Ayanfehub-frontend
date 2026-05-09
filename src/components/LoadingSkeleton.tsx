import { cn } from '../lib/utils';

function Bone({ className }: { className?: string }) {
  return <div className={cn('bg-gray-200 animate-pulse rounded-lg', className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <Bone className="h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Bone className="h-5 w-20" />
          <Bone className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ArtisanCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <Bone className="h-64 rounded-none" />
      <div className="p-6 space-y-3">
        <Bone className="h-5 w-2/3" />
        <Bone className="h-3 w-1/3" />
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <Bone className="h-6 w-24" />
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex justify-between">
        <Bone className="h-5 w-32" />
        <Bone className="h-6 w-24 rounded-full" />
      </div>
      <Bone className="h-3 w-48" />
      <div className="flex justify-between pt-2">
        <Bone className="h-5 w-20" />
        <Bone className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <Bone className="h-48 rounded-none" />
      <div className="p-5 space-y-3">
        <Bone className="h-5 w-3/4" />
        <Bone className="h-3 w-1/2" />
        <Bone className="h-3 w-1/3" />
      </div>
    </div>
  );
}

interface GridSkeletonProps {
  count?: number;
  variant?: 'product' | 'artisan' | 'order' | 'market';
}

export function GridSkeleton({ count = 6, variant = 'product' }: GridSkeletonProps) {
  const SkeletonComponent = {
    product: ProductCardSkeleton,
    artisan: ArtisanCardSkeleton,
    order: OrderCardSkeleton,
    market: MarketCardSkeleton,
  }[variant];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}
