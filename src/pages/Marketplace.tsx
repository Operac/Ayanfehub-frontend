import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Search } from 'lucide-react';
import MarketCard from '../components/MarketCard';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import type { Market } from '../types/api';

async function fetchMarkets(): Promise<Market[]> {
  const { data } = await axios.get('/markets');
  return data;
}

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: markets = [], isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarkets,
    staleTime: 5 * 60 * 1000,
  });

  const filtered = markets.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lagos Markets</h1>
          <p className="text-gray-500">Fresh produce directly from your favorite local markets.</p>
        </div>

        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search markets..."
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
            filtered.map(market => <MarketCard key={market.id} {...market} />)
          ) : (
            <EmptyState
              title="No markets found"
              description={searchTerm ? `No results for "${searchTerm}"` : 'No markets available right now.'}
              action={searchTerm ? { label: 'Clear search', onClick: () => setSearchTerm('') } : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
