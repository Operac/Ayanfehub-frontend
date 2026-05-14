import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Star, Wrench, Scissors, ChefHat, Home } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import type { Artisan } from '../types/api';

const CATEGORIES = ['All', 'Personal & Fashion', 'Home & Property', 'Food & Lifestyle'];

const CATEGORY_STYLES: Record<string, { gradient: string; icon: React.ReactNode }> = {
  'Personal & Fashion': { gradient: 'from-pink-500 to-rose-600', icon: <Scissors size={36} className="text-white/80" /> },
  'Home & Property':    { gradient: 'from-blue-500 to-indigo-600', icon: <Home size={36} className="text-white/80" /> },
  'Food & Lifestyle':   { gradient: 'from-amber-500 to-orange-500', icon: <ChefHat size={36} className="text-white/80" /> },
};

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? { gradient: 'from-emerald-500 to-teal-600', icon: <Wrench size={36} className="text-white/80" /> };
}

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

async function fetchArtisans(category: string): Promise<Artisan[]> {
  const url = category === 'All' ? '/artisans' : `/artisans?category=${encodeURIComponent(category)}`;
  const { data } = await axios.get(url);
  return data;
}

export default function Artisans() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const { data: artisans = [], isLoading } = useQuery({
    queryKey: ['artisans', selectedCategory],
    queryFn: () => fetchArtisans(selectedCategory),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
      >
        <div>
          <h1 className="text-4xl font-black text-ink tracking-tight mb-2">Hire Skilled Artisans</h1>
          <p className="text-muted text-lg">Verified professionals for your home and lifestyle needs.</p>
        </div>
      </motion.div>

      <div className="flex overflow-x-auto pb-4 gap-3 mb-10 no-scrollbar">
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.96 }}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all',
              selectedCategory === cat
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white border border-gray-200 text-muted hover:bg-surface'
            )}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {isLoading ? (
        <GridSkeleton count={6} variant="artisan" />
      ) : artisans.length > 0 ? (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {artisans.map(artisan => {
            const { gradient, icon } = getCategoryStyle(artisan.category);
            return (
              <motion.div
                key={artisan.id}
                variants={item}
                onClick={() => navigate(`/artisans/${artisan.id}`)}
                className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-64 overflow-hidden">
                  {artisan.portfolioImages?.[0] ? (
                    <img
                      src={artisan.portfolioImages[0]}
                      alt={artisan.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className={cn('w-full h-full flex flex-col items-center justify-center bg-gradient-to-br', gradient)}>
                      <div className="opacity-60">{icon}</div>
                      <p className="text-white/60 text-xs mt-2 font-medium">{artisan.category}</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-black text-ink shadow-sm flex items-center gap-1">
                    <Star size={11} className="text-amber-500 fill-amber-500" />
                    {artisan.ratingAverage ? parseFloat(String(artisan.ratingAverage)).toFixed(1) : 'New'}
                  </div>
                  <div className={cn(
                    'absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold',
                    artisan.isAvailable ? 'bg-emerald-500 text-white' : 'bg-gray-800/80 text-white'
                  )}>
                    {artisan.isAvailable ? '● Available' : 'Busy'}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-black text-ink mb-1">{artisan.name}</h3>
                  <p className="text-sm text-muted mb-4">{artisan.category}</p>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted text-xs uppercase tracking-wider">Starts from</span>
                      {artisan.services && artisan.services.length > 0 ? (
                        <p className="font-black text-primary text-lg">
                          {formatCurrency(Math.min(...artisan.services.map(s => s.priceNgn)))}
                        </p>
                      ) : (
                        <p className="text-muted text-sm">Contact for price</p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      View Profile →
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          title="No artisans found"
          description={`No artisans in the "${selectedCategory}" category yet.`}
          action={{ label: 'View all artisans', onClick: () => setSelectedCategory('All') }}
        />
      )}
    </div>
  );
}
