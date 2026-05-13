import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion, type Variants } from 'framer-motion';
import { Search, Store } from 'lucide-react';
import MarketCard from '../components/MarketCard';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import type { Market } from '../types/api';

async function fetchMarkets(): Promise<Market[]> {
  const { data } = await axios.get('/markets');
  return data;
}

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Fresh Food', value: 'food' },
  { label: 'Fashion', value: 'fashion' },
  { label: 'General', value: 'goods' },
  { label: 'Artisanal', value: 'artisanal' },
];

const stagger: { container: Variants; item: Variants } = {
  container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } },
};

export default function Marketplace() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');

  const { data: markets = [], isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarkets,
    staleTime: 5 * 60 * 1000,
  });

  const filtered = markets.filter(m => {
    const matchesSearch   = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || m.category?.toLowerCase() === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-ink tracking-tight mb-2">
            Lagos Markets
          </h1>
          <p className="text-muted">
            {isLoading ? 'Loading…' : `${markets.length} market${markets.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search markets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </motion.div>

      {/* Category pills */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 flex-wrap mb-8"
      >
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              category === cat.value
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-white text-muted border border-gray-200 hover:border-primary/30 hover:text-ink'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <GridSkeleton count={6} variant="market" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Store size={32} />}
          title="No markets found"
          description={search ? `No results for "${search}"` : 'No markets available right now.'}
          action={search || category ? { label: 'Clear filters', onClick: () => { setSearch(''); setCategory(''); } } : undefined}
        />
      ) : (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map(market => (
            <motion.div key={market.id} variants={stagger.item}>
              <MarketCard {...market} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
