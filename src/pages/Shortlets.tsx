import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MapPin, Star, Wifi, Home, Search, BedDouble } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import type { Apartment } from '../types/api';

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

async function fetchShortlets(): Promise<Apartment[]> {
  const { data } = await axios.get('/shortlets');
  return data;
}

export default function Shortlets() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { data: apartments = [], isLoading } = useQuery({
    queryKey: ['shortlets'],
    queryFn: fetchShortlets,
    staleTime: 10 * 60 * 1000,
  });

  const filtered = apartments.filter(apt =>
    apt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
      >
        <div>
          <h1 className="text-4xl font-black text-ink tracking-tight mb-2">Short-let Apartments</h1>
          <p className="text-muted text-lg">Comfortable stays in prime Lagos locations.</p>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm text-sm"
          />
          <Search className="absolute left-3 top-3.5 text-muted" size={16} />
        </div>
      </motion.div>

      {isLoading ? (
        <GridSkeleton count={6} variant="market" />
      ) : filtered.length > 0 ? (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filtered.map(apt => (
            <motion.div
              key={apt.id}
              variants={item}
              onClick={() => navigate(`/shortlets/${apt.id}`)}
              className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="relative h-64 overflow-hidden">
                {apt.images?.[0] ? (
                  <img
                    src={apt.images[0]}
                    alt={apt.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-500 to-purple-700">
                    <BedDouble size={40} className="text-white/70" />
                    <p className="text-white/50 text-xs mt-2 font-medium">Shortlet</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {apt.ratingAverage != null && (
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black text-ink shadow-sm flex items-center gap-1">
                    <Star size={11} className="text-amber-500 fill-amber-500" />
                    {Number(apt.ratingAverage).toFixed(1)}
                  </div>
                )}
                {!apt.isAvailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white/90 backdrop-blur text-ink font-black px-5 py-2 rounded-full text-sm">
                      Unavailable
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-lg font-black text-ink line-clamp-1 mb-1">{apt.name}</h3>

                <div className="flex items-center gap-1.5 text-sm text-muted mb-4">
                  <MapPin size={13} />
                  {apt.location}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  {apt.amenities?.includes('WiFi') && (
                    <div className="flex items-center gap-1 text-xs text-muted bg-surface px-2.5 py-1 rounded-full">
                      <Wifi size={11} /> WiFi
                    </div>
                  )}
                  {apt.amenities?.includes('AC') && (
                    <div className="flex items-center gap-1 text-xs text-muted bg-surface px-2.5 py-1 rounded-full">
                      <Home size={11} /> AC
                    </div>
                  )}
                  {apt.amenities == null && (
                    <>
                      <div className="flex items-center gap-1 text-xs text-muted bg-surface px-2.5 py-1 rounded-full">
                        <Wifi size={11} /> WiFi
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted bg-surface px-2.5 py-1 rounded-full">
                        <Home size={11} /> AC
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="font-black text-primary text-xl">{formatCurrency(apt.ratePerNight)}</span>
                    <span className="text-sm text-muted"> / night</span>
                  </div>
                  <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    View details →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          title="No apartments found"
          description={searchTerm ? `No results for "${searchTerm}"` : 'No apartments available right now.'}
          action={searchTerm ? { label: 'Clear search', onClick: () => setSearchTerm('') } : undefined}
        />
      )}
    </div>
  );
}
