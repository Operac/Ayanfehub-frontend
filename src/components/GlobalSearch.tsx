import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, X, ShoppingBasket, Wrench, Home } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface ProductResult {
  id: string;
  name: string;
  unit: string;
  market: { id: string; name: string };
  priceEntries: { priceNgn: number }[];
}

interface MarketResult {
  id: string;
  name: string;
}

interface ArtisanResult {
  id: string;
  name: string;
  category: string;
}

interface ShortletResult {
  id: string;
  name: string;
  location: string;
  ratePerNight: number;
}

interface SearchResults {
  products: ProductResult[];
  markets: MarketResult[];
  artisans: ArtisanResult[];
  shortlets: ShortletResult[];
}

let debounceTimer: ReturnType<typeof setTimeout>;

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults(null); setOpen(false); return; }
    setLoading(true);
    try {
      const [marketsRes, artisansRes, shortletsRes] = await Promise.all([
        axios.get('/markets/search', { params: { q } }),
        axios.get('/artisans/search', { params: { q } }),
        axios.get('/shortlets/search', { params: { q } }),
      ]);
      setResults({
        products: marketsRes.data.products || [],
        markets: marketsRes.data.markets || [],
        artisans: artisansRes.data || [],
        shortlets: shortletsRes.data || [],
      });
      setOpen(true);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(q), 350);
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    navigate(path);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasResults = results && (
    results.products.length + results.markets.length + results.artisans.length + results.shortlets.length > 0
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5e8d88]" />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => results && setOpen(true)}
          className="w-full h-10 pl-9 pr-8 rounded-lg border-none bg-[#f0f5f4] text-[#101818] placeholder:text-[#5e8d88] focus:ring-2 focus:ring-primary text-sm focus:outline-none"
          placeholder="Search markets, artisans, shortlets..."
          type="text"
        />
        {query && (
          <button onClick={handleClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-[480px] overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Searching…</div>
          )}

          {!loading && !hasResults && query && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No results for "{query}"</div>
          )}

          {!loading && hasResults && (
            <div className="py-2">
              {results!.markets.length > 0 && (
                <section>
                  <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Markets</p>
                  {results!.markets.map(m => (
                    <button key={m.id} onClick={() => go(`/markets/${m.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left">
                      <ShoppingBasket size={15} className="text-primary shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{m.name}</span>
                    </button>
                  ))}
                </section>
              )}

              {results!.products.length > 0 && (
                <section>
                  <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Products</p>
                  {results!.products.slice(0, 5).map(p => (
                    <button key={p.id} onClick={() => go(`/markets/${p.market.id}`)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50 text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <ShoppingBasket size={15} className="text-gray-300 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.market.name} · per {p.unit}</p>
                        </div>
                      </div>
                      {p.priceEntries[0] && (
                        <span className="text-sm font-bold text-primary shrink-0">{formatCurrency(p.priceEntries[0].priceNgn)}</span>
                      )}
                    </button>
                  ))}
                </section>
              )}

              {results!.artisans.length > 0 && (
                <section>
                  <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Artisans</p>
                  {results!.artisans.slice(0, 3).map(a => (
                    <button key={a.id} onClick={() => go(`/artisans/${a.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left">
                      <Wrench size={15} className="text-orange-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-400">{a.category}</p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {results!.shortlets.length > 0 && (
                <section>
                  <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Short-lets</p>
                  {results!.shortlets.slice(0, 3).map(s => (
                    <button key={s.id} onClick={() => go(`/shortlets/${s.id}`)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50 text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <Home size={15} className="text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.location}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary shrink-0">{formatCurrency(Number(s.ratePerNight))}/night</span>
                    </button>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
