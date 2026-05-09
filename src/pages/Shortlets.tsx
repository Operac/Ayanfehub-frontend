import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MapPin, Star, Wifi, Home, Search } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import type { Apartment } from '../types/api';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Short-let Apartments</h1>
          <p className="text-gray-500">Comfortable stays in prime Lagos locations.</p>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton count={6} variant="market" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.length > 0 ? (
            filtered.map(apt => (
              <div
                key={apt.id}
                onClick={() => navigate(`/shortlets/${apt.id}`)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  {apt.images?.[0] ? (
                    <img
                      src={apt.images[0]}
                      alt={apt.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
                    <Star size={12} className="text-orange-500 fill-orange-500" />
                    4.8
                  </div>
                  {!apt.isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-800 font-bold px-4 py-2 rounded-full text-sm">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">{apt.name}</h3>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin size={14} />
                    {apt.location}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Wifi size={12} /> WiFi
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Home size={12} /> AC
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-orange-600 text-lg">{formatCurrency(apt.ratePerNight)}</span>
                      <span className="text-sm text-gray-400"> / night</span>
                    </div>
                    <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No apartments found"
              description={searchTerm ? `No results for "${searchTerm}"` : 'No apartments available right now.'}
              action={searchTerm ? { label: 'Clear search', onClick: () => setSearchTerm('') } : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
