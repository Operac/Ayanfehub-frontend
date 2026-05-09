import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Star } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import type { Artisan } from '../types/api';

const CATEGORIES = ['All', 'Personal & Fashion', 'Home & Property', 'Food & Lifestyle'];

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Hire Skilled Artisans</h1>
          <p className="text-gray-500">Verified professionals for your home and lifestyle needs.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-4 gap-3 mb-8 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              selectedCategory === cat
                ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <GridSkeleton count={6} variant="artisan" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artisans.length > 0 ? (
            artisans.map(artisan => (
              <div
                key={artisan.id}
                onClick={() => navigate(`/artisans/${artisan.id}`)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  {artisan.portfolioImages?.[0] ? (
                    <img
                      src={artisan.portfolioImages[0]}
                      alt={artisan.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
                    <Star size={12} className="text-orange-500 fill-orange-500" />
                    {artisan.ratingAverage ? artisan.ratingAverage.toFixed(1) : 'New'}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{artisan.name}</h3>
                      <p className="text-sm text-gray-500">{artisan.category}</p>
                    </div>
                    <div className={cn(
                      'px-2 py-1 rounded text-xs font-semibold',
                      artisan.isAvailable ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {artisan.isAvailable ? 'Available' : 'Busy'}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-500">Starts from</span>
                      {artisan.services && artisan.services.length > 0 ? (
                        <p className="font-bold text-orange-600 text-lg">
                          {formatCurrency(Math.min(...artisan.services.map(s => s.priceNgn)))}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm">Contact for price</p>
                      )}
                    </div>
                    <button className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No artisans found"
              description={`No artisans in the "${selectedCategory}" category yet.`}
              action={{ label: 'View all artisans', onClick: () => setSelectedCategory('All') }}
            />
          )}
        </div>
      )}
    </div>
  );
}
