import { motion } from 'framer-motion';

function Bone({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
      <Bone className="h-48 rounded-none rounded-t-3xl" />
      <div className="p-5 space-y-3">
        <Bone className="h-5 w-3/4" />
        <Bone className="h-4 w-1/2" />
        <div className="flex justify-between pt-1">
          <Bone className="h-6 w-20" />
          <Bone className="h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
      <Bone className="h-52 rounded-none rounded-t-3xl" />
      <div className="p-5 space-y-3">
        <Bone className="h-10 rounded-xl" />
        <div className="flex items-center justify-between">
          <Bone className="h-4 w-24" />
          <Bone className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function ArtisanCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Bone className="size-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-5 w-3/4" />
          <Bone className="h-4 w-1/2" />
        </div>
      </div>
      <Bone className="h-4 w-full" />
      <Bone className="h-4 w-5/6" />
      <div className="flex justify-between">
        <Bone className="h-5 w-20" />
        <Bone className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Bone className="h-5 w-32" />
          <Bone className="h-4 w-24" />
        </div>
        <Bone className="h-7 w-28 rounded-full" />
      </div>
      <div className="h-px bg-gray-100" />
      <div className="space-y-2">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-4/5" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6, variant = 'market' }: { count?: number; variant?: 'market' | 'product' | 'artisan' | 'order' }) {
  const SkeletonMap = {
    market:  MarketCardSkeleton,
    product: ProductCardSkeleton,
    artisan: ArtisanCardSkeleton,
    order:   OrderCardSkeleton,
  };
  const Card = SkeletonMap[variant];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`grid gap-6 ${
        variant === 'order'
          ? 'grid-cols-1 max-w-2xl'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} />
      ))}
    </motion.div>
  );
}
