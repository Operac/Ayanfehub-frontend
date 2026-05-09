import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';
import { Package, ShoppingBag, Star, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';

interface VendorStats {
  vendor: { id: string; businessName: string; verificationStatus: string; ratingAverage: string | null; totalOrdersFulfilled: number };
  stats: { activeProducts: number; totalOrderItems: number; totalRevenue: string | number; ratingAverage: string | null; totalOrdersFulfilled: number };
  recentReviews: { id: string; rating: number; comment: string | null; createdAt: string; user: { fullName: string | null } }[];
}

interface Product {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
  priceEntries: { priceNgn: number }[];
  category: { name: string } | null;
  _count: { orderItems: number };
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPriceNgn: string | number;
  totalPriceNgn: string | number;
  product: { name: string; unit: string };
  order: { id: string; orderNumber: string; status: string; createdAt: string; user: { fullName: string | null; phone: string } };
}

const STATUS_COLORS: Record<string, string> = {
  PAYMENT_CONFIRMED: 'text-blue-700 bg-blue-50',
  SOURCING:          'text-amber-700 bg-amber-50',
  AT_HUB:            'text-purple-700 bg-purple-50',
  OUT_FOR_DELIVERY:  'text-indigo-700 bg-indigo-50',
  DELIVERED:         'text-green-700 bg-green-50',
  CANCELLED:         'text-red-700 bg-red-50',
};

type Tab = 'overview' | 'products' | 'orders';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [statsData, setStatsData] = useState<VendorStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    const load = async () => {
      try {
        const [statsRes] = await Promise.all([
          axios.get('/vendors/me/stats'),
        ]);
        setStatsData(statsRes.data);
      } catch {
        showToast('No vendor profile linked to your account', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  useEffect(() => {
    if (tab === 'products' && products.length === 0) {
      axios.get('/vendors/me/products').then(r => setProducts(r.data)).catch(() => showToast('Failed to load products', 'error'));
    }
    if (tab === 'orders' && orderItems.length === 0) {
      axios.get('/vendors/me/orders').then(r => setOrderItems(r.data)).catch(() => showToast('Failed to load orders', 'error'));
    }
  }, [tab]);

  const toggleProduct = async (product: Product) => {
    try {
      await axios.patch(`/vendors/me/products/${product.id}`, { isActive: !product.isActive });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      showToast(`Product ${product.isActive ? 'deactivated' : 'activated'}`, 'success');
    } catch {
      showToast('Failed to update product', 'error');
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  if (!statsData) return null;

  const { stats, vendor, recentReviews } = statsData;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h1>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block',
            vendor.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
            vendor.verificationStatus === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          )}>{vendor.verificationStatus}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['overview', 'products', 'orders'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            )}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Package size={20} />} label="Active Products" value={stats.activeProducts} />
            <StatCard icon={<ShoppingBag size={20} />} label="Total Orders" value={stats.totalOrderItems} />
            <StatCard icon={<TrendingUp size={20} />} label="Revenue" value={formatCurrency(Number(stats.totalRevenue))} />
            <StatCard icon={<Star size={20} />} label="Rating" value={stats.ratingAverage ? `${parseFloat(String(stats.ratingAverage)).toFixed(1)} / 5` : 'No ratings'} />
          </div>

          {/* Recent Reviews */}
          {recentReviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Recent Reviews</h3>
              <div className="space-y-3">
                {recentReviews.map(r => (
                  <div key={r.id} className="border-b border-gray-50 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{r.user.fullName || 'Customer'}</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={cn('text-xs', s <= r.rating ? 'text-amber-400' : 'text-gray-200')}>★</span>
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-gray-500 leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'products' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p>No products yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Product</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Category</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Current Price</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Orders</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className={cn('hover:bg-gray-50 transition', !p.isActive && 'opacity-50')}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">per {p.unit}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{p.category?.name ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {p.priceEntries[0] ? formatCurrency(p.priceEntries[0].priceNgn) : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{p._count.orderItems}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => toggleProduct(p)} className="text-gray-400 hover:text-primary transition">
                        {p.isActive ? <ToggleRight size={24} className="text-primary" /> : <ToggleLeft size={24} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {orderItems.length === 0 ? (
            <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
              <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
              <p>No orders yet</p>
            </div>
          ) : (
            orderItems.map(item => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-400">Qty {item.quantity} × {formatCurrency(Number(item.unitPriceNgn))} · {item.order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{item.order.user.fullName || item.order.user.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{formatCurrency(Number(item.totalPriceNgn))}</p>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', STATUS_COLORS[item.order.status] ?? 'bg-gray-50 text-gray-600')}>
                    {item.order.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(item.order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="size-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center">{icon}</div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}
