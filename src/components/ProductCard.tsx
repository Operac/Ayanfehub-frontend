import { motion } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  unit: string;
  marketId: string;
  marketName: string;
  imageUrl?: string;
  ratingAverage?: number;
  category?: string;
}

export default function ProductCard({
  id,
  name,
  price,
  unit,
  marketId,
  marketName,
  imageUrl,
  ratingAverage,
  category,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id,
      name,
      market_id: marketId,
      price,
      unit,
    });
    showToast(`${name} added to cart`, 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer h-full flex flex-col"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-gray-100 shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <ShoppingCart size={32} className="text-white/30" />
          </div>
        )}

        {/* Category badge */}
        {category && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex px-2 py-1 text-xs font-bold text-white bg-black/60 rounded-lg">
              {category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm text-ink line-clamp-2 mb-1">{name}</h3>
        <p className="text-xs text-muted mb-3">
          {marketName} • per {unit}
        </p>

        {/* Rating */}
        {ratingAverage !== undefined && ratingAverage > 0 && (
          <div className="flex items-center gap-1 mb-3 text-xs text-amber-600">
            <Star size={12} className="fill-amber-500" />
            <span className="font-semibold">{parseFloat(String(ratingAverage)).toFixed(1)}</span>
          </div>
        )}

        {/* Price & Button */}
        <div className="flex items-center justify-between mt-auto">
          <span className="font-black text-ink">{formatCurrency(price)}</span>
          <motion.button
            onClick={handleAddToCart}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="size-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
          >
            <ShoppingCart size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
