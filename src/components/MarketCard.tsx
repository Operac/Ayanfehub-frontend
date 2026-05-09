import { useNavigate } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import type { Market } from '../types/api';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function nextDeliveryLabel(runDays?: Market['runDays']): string | null {
  if (!runDays || runDays.length === 0) return null;
  const today = new Date().getDay();
  const sorted = [...runDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const next = sorted.find(r => r.dayOfWeek >= today) ?? sorted[0];
  return `${DAY_NAMES[next.dayOfWeek]}s before ${next.cutoffHour}:00`;
}

export default function MarketCard({ id, name, imageUrl, category, runDays, lat, lng }: Market) {
  const navigate = useNavigate();
  const deliveryLabel = nextDeliveryLabel(runDays);
  const hasLocation = lat != null && lng != null;

  return (
    <div
      onClick={() => navigate(`/markets/${id}`)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1 block h-full"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-xs text-white/80 mt-0.5">{category}</p>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {deliveryLabel && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 p-2 rounded-lg">
            <Clock size={16} className="text-orange-600 shrink-0" />
            <span className="font-medium">Order by <span className="text-orange-700">{deliveryLabel}</span></span>
          </div>
        )}
        {hasLocation && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={14} />
            <span>{lat?.toFixed(4)}°N, {lng?.toFixed(4)}°E</span>
          </div>
        )}
        <button className="w-full mt-2 bg-gray-900 text-white py-2.5 rounded-xl font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
          View Market
        </button>
      </div>
    </div>
  );
}
