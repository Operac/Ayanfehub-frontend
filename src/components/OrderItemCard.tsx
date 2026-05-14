import { Star, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion } from 'framer-motion';

interface OrderItemCardProps {
  id: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  subtotal: number;
  vendorName?: string;
  status?: 'PENDING' | 'SOURCING' | 'AT_HUB' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  ratingAverage?: number;
  onRemove?: () => void;
  showRemove?: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  SOURCING: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  AT_HUB: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  OUT_FOR_DELIVERY: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
};

export default function OrderItemCard({
  // id is kept for API compatibility / future tracking features
  id: _unused,
  productName,
  productImage,
  quantity,
  unit,
  pricePerUnit,
  subtotal,
  vendorName,
  status = 'PENDING',
  ratingAverage,
  onRemove,
  showRemove = false,
}: OrderItemCardProps) {
  const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  const statusLabel = status.replace(/_/g, ' ');

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
          {productImage ? (
            <img src={productImage} alt={productName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-ink truncate">{productName}</h3>
          {vendorName && (
            <p className="text-xs text-muted mt-0.5">{vendorName}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted">
              {formatCurrency(pricePerUnit)} × {quantity} {unit}
            </span>
            {ratingAverage !== undefined && ratingAverage > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <Star size={12} className="fill-amber-500" />
                <span className="text-xs font-semibold">{parseFloat(String(ratingAverage)).toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Status */}
          {status && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
              <div className={`size-1.5 rounded-full ${statusConfig.dot}`} />
              {statusLabel}
            </div>
          )}
        </div>

        {/* Price & Actions */}
        <div className="flex flex-col items-end justify-between shrink-0">
          <span className="font-black text-ink">{formatCurrency(subtotal)}</span>
          {showRemove && onRemove && (
            <motion.button
              onClick={onRemove}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="size-8 flex items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
