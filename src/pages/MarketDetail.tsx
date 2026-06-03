import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/utils';
import ReviewSection from '../components/ReviewSection';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface PriceEntry {
  priceNgn: number;
}

interface Item {
  id: string;
  name: string;
  unit: string;
  imageUrls: string[];
  vendorId: string;
  category?: { name: string } | null;
  priceEntries: PriceEntry[];
}

interface RunDay {
  dayOfWeek: number;
  cutoffHour: number;
}

interface Market {
  id: string;
  name: string;
  imageUrl: string | null;
  runDays?: RunDay[];
}

function getItemPrice(item: Item): number {
  return item.priceEntries?.[0]?.priceNgn ?? 0;
}

export default function MarketDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [market, setMarket] = useState<Market | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    const fetchMarketDetails = async () => {
      try {
        const { data } = await axios.get(`/markets/${id}/items`);
        setMarket(data.market);
        setItems(data.items);
        setFetchError(false);
      } catch (error) {
        console.error('Failed to fetch details', error);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMarketDetails();
  }, [id]);

  const categories = ['All Items', ...Array.from(new Set(items.map(i => i.category?.name).filter(Boolean)))];
  const filteredItems = activeCategory === 'All Items' ? items : items.filter(i => i.category?.name === activeCategory);

  const today = new Date().getDay();
  const sorted = [...(market?.runDays ?? [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const nextDelivery = sorted.find(r => r.dayOfWeek >= today) ?? sorted[0];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[#BB8A52] font-medium">Loading market details...</p>
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light gap-4">
      <h2 className="text-2xl font-bold text-[#0C3B2E]">Failed to load market</h2>
      <p className="text-[#BB8A52]">Something went wrong. Please try again.</p>
      <button
        onClick={() => { setFetchError(false); setLoading(true); if (id) { axios.get(`/markets/${id}/items`).then(({ data }) => { setMarket(data.market); setItems(data.items); }).catch(() => setFetchError(true)).finally(() => setLoading(false)); } }}
        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
      >
        Retry
      </button>
      <Link to="/marketplace" className="text-primary hover:underline font-bold">Return to Marketplace</Link>
    </div>
  );

  if (!market) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light gap-4">
      <h2 className="text-2xl font-bold text-[#0C3B2E]">Market not found</h2>
      <Link to="/marketplace" className="text-primary hover:underline font-bold">Return to Marketplace</Link>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto pb-20 px-4 md:px-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 px-4 pt-6 text-sm">
        <Link to="/marketplace" className="text-[#BB8A52] hover:text-primary font-medium">Markets</Link>
        <span className="text-[#BB8A52]">›</span>
        <span className="text-[#0C3B2E] font-semibold">{market.name}</span>
      </div>

      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-4 mt-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-[#0C3B2E] text-4xl md:text-5xl font-black leading-tight tracking-tight">{market.name}</h2>
          <p className="text-[#BB8A52] text-lg font-normal">Fresh items curated and vetted by Ayanfe quality assurance</p>
        </div>
      </div>

      {/* Delivery Banner */}
      <div className="px-4 py-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary text-white">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            <div className="flex flex-col">
              <p className="text-[#0C3B2E] text-lg font-bold">
                Next Delivery: <span className="text-primary">{nextDelivery ? DAY_NAMES[nextDelivery.dayOfWeek] : 'Saturday'}</span>
              </p>
              <p className="text-[#BB8A52] text-sm">
                Order before <span className="font-bold text-red-600">{nextDelivery ? `${DAY_NAMES[(nextDelivery.dayOfWeek + 6) % 7]} ${nextDelivery.cutoffHour}:00` : 'Friday 12:00'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowReviews(v => !v)}
            className="w-full md:w-auto flex items-center justify-center rounded-lg h-11 px-6 bg-primary text-white text-sm font-bold tracking-wide transition-transform hover:scale-105 shadow-lg shadow-primary/20"
          >
            {showReviews ? 'Hide Reviews' : 'View Reviews'}
          </button>
        </div>
      </div>

      {/* Reviews (collapsible) */}
      {showReviews && items.length > 0 && (
        <div className="px-4 py-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Customer Reviews</h3>
            <ReviewSection vendorId={items[0].vendorId} />
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="sticky top-0 z-40 bg-[#F9FAF9] bg-opacity-95 backdrop-blur-sm py-4 px-4 transition-all">
        <div className="flex border-b border-[#e2eae6] gap-8 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat!)}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-3 transition-all whitespace-nowrap px-2 ${
                activeCategory === cat
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#BB8A52] hover:text-primary'
              }`}
            >
              <p className="text-sm font-bold">{cat}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <p className="text-[#BB8A52] text-lg">No items available in this market currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map(item => {
              const price = getItemPrice(item);
              return (
                <div key={item.id} className="flex flex-col bg-white rounded-xl overflow-hidden border border-[#e2eae6] hover:shadow-xl transition-all group">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url("${item.imageUrls?.[0] || 'https://placehold.co/400x300?text=No+Image'}")` }}
                    />
                    <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">VETTED</div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="mb-auto">
                      <h3 className="text-[#0C3B2E] font-bold text-base leading-tight line-clamp-2">{item.name}</h3>
                      <p className="text-[#BB8A52] text-xs mt-1">per {item.unit}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-primary font-black text-lg">
                        {price > 0 ? formatCurrency(price) : <span className="text-sm text-gray-400">Price TBD</span>}
                      </span>
                      <button
                        onClick={() => addToCart({ id: item.id, name: item.name, price, unit: item.unit, market_id: id! })}
                        disabled={price === 0}
                        className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filteredItems.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-[#BB8A52] text-sm">Showing {filteredItems.length} items at {market.name}</p>
        </div>
      )}
    </div>
  );
}
