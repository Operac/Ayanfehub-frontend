import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Store } from 'lucide-react';
import type { Market } from '../types/api';
import Card3D from './Card3D';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CATEGORY_GRADIENTS: Record<string, string> = {
  food:       'from-emerald-500 to-primary',
  fashion:    'from-pink-500 to-rose-600',
  goods:      'from-blue-500 to-indigo-600',
  artisanal:  'from-amber-500 to-orange-500',
};

function nextDeliveryLabel(runDays?: Market['runDays']): string | null {
  if (!runDays || runDays.length === 0) return null;
  const today = new Date().getDay();
  const sorted = [...runDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const next = sorted.find(r => r.dayOfWeek >= today) ?? sorted[0];
  const day = DAY_NAMES[next.dayOfWeek];
  const isToday = next.dayOfWeek === today;
  return `${isToday ? 'Today' : day} before ${next.cutoffHour}:00`;
}

export default function MarketCard({ id, name, imageUrl, category, runDays }: Market) {
  const navigate = useNavigate();
  const deliveryLabel = nextDeliveryLabel(runDays);
  const gradient = CATEGORY_GRADIENTS[category?.toLowerCase() ?? ''] ?? 'from-primary to-primary-dark';

  return (
    <Card3D intensity={6} glare scale={1.02}>
      <motion.div
        onClick={() => navigate(`/markets/${id}`)}
        className="cursor-pointer bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group h-full flex flex-col"
        whileTap={{ scale: 0.98 }}
      >
        {/* Image / placeholder */}
        <div className="relative h-52 overflow-hidden shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Store size={48} className="text-white/40" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Category badge */}
          {category && (
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${gradient} shadow-md`}>
                {category}
              </span>
            </div>
          )}

          {/* Market name on image */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-black text-white leading-tight drop-shadow-lg">{name}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col gap-3">
          {/* Delivery info */}
          {deliveryLabel ? (
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <Clock size={14} className="text-amber-600 shrink-0" />
              <span className="text-xs font-semibold text-amber-800">
                Order by <span className="text-amber-600">{deliveryLabel}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <Clock size={14} className="text-gray-400 shrink-0" />
              <span className="text-xs font-medium text-gray-400">Schedule TBC</span>
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto flex items-center justify-between">
            <span className="text-sm font-semibold text-muted group-hover:text-ink transition-colors">
              Browse items
            </span>
            <motion.div
              className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"
              whileHover={{ x: 2 }}
            >
              <ArrowRight size={16} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Card3D>
  );
}
