import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Package, Users, ShoppingBag, ChevronDown } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalNgn: string | number;
  createdAt: string;
  user: { fullName: string | null; phone: string } | null;
  items: { product: { name: string } | null; vendor: { businessName: string } | null }[];
}

interface Reports {
  summary: { totalOrders: number; totalRevenue: string | number };
  statusBreakdown: { status: string; _count: number }[];
  topVendors: { vendorId: string; businessName: string; revenue: string | number; orderCount: number }[];
  recentOrders: Order[];
}

interface Vendor {
  id: string;
  businessName: string;
  verificationStatus: string;
  ratingAverage: string | null;
  totalOrdersFulfilled: number;
  market: { name: string };
  _count: { products: number; orderItems: number };
}

const ORDER_STATUSES = ['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'SOURCING', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const STATUS_COLORS: Record<string, string> = {
  DELIVERED:         'text-green-700 bg-green-50',
  PAYMENT_CONFIRMED: 'text-blue-700 bg-blue-50',
  SOURCING:          'text-amber-700 bg-amber-50',
  AT_HUB:            'text-purple-700 bg-purple-50',
  OUT_FOR_DELIVERY:  'text-indigo-700 bg-indigo-50',
  PENDING_PAYMENT:   'text-amber-700 bg-amber-50',
  CANCELLED:         'text-red-700 bg-red-50',
};

type Tab = 'reports' | 'orders' | 'vendors';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('reports');

  const [reports, setReports] = useState<Reports | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadReports();
  }, [user, navigate]);

  useEffect(() => {
    if (tab === 'orders' && orders.length === 0) loadOrders();
    if (tab === 'vendors' && vendors.length === 0) loadVendors();
  }, [tab]);

  const loadReports = async () => {
    try {
      const { data } = await axios.get('/admin/reports');
      setReports(data);
    } catch {
      showToast('Failed to load reports', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  const loadOrders = async () => {
    try {
      const { data } = await axios.get('/admin/orders');
      setOrders(data);
    } catch {
      showToast('Failed to load orders', 'error');
    }
  };

  const loadVendors = async () => {
    try {
      const { data } = await axios.get('/admin/vendors');
      setVendors(data);
    } catch {
      showToast('Failed to load vendors', 'error');
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingStatus(orderId);
    try {
      await axios.patch('/orders/status', { orderId, status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      showToast('Order status updated', 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleVendorVerification = async (vendorId: string, status: string) => {
    try {
      await axios.patch('/admin/vendors/verification', { vendorId, status });
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, verificationStatus: status } : v));
      showToast('Vendor status updated', 'success');
    } catch {
      showToast('Failed to update vendor', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['reports', 'orders', 'vendors'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Reports Tab ── */}
      {tab === 'reports' && (
        loadingReports ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : reports ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<ShoppingBag size={20} />} label="Total Orders (30d)" value={reports.summary.totalOrders} />
              <StatCard icon={<TrendingUp size={20} />} label="Revenue (30d)" value={formatCurrency(Number(reports.summary.totalRevenue))} />
              <StatCard icon={<Package size={20} />} label="Top Vendor Orders" value={reports.topVendors[0]?.orderCount ?? 0} />
              <StatCard icon={<Users size={20} />} label="Top Vendor Revenue" value={formatCurrency(Number(reports.topVendors[0]?.revenue ?? 0))} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Status Breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Order Status Breakdown</h3>
                <div className="space-y-2">
                  {reports.statusBreakdown.map(s => (
                    <div key={s.status} className="flex items-center justify-between">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', STATUS_COLORS[s.status] ?? 'bg-gray-50 text-gray-600')}>
                        {s.status.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-gray-900">{s._count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Vendors */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Top Vendors (30d)</h3>
                <div className="space-y-3">
                  {reports.topVendors.map((v, i) => (
                    <div key={v.vendorId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="size-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <p className="text-sm font-medium text-gray-900">{v.businessName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(v.revenue))}</p>
                        <p className="text-xs text-gray-400">{v.orderCount} orders</p>
                      </div>
                    </div>
                  ))}
                  {reports.topVendors.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No order data yet</p>}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Recent Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Order</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Customer</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                      <th className="px-5 py-3 text-right font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reports.recentOrders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">{o.orderNumber}</td>
                        <td className="px-5 py-3 text-gray-700">{o.user?.fullName || o.user?.phone || '—'}</td>
                        <td className="px-5 py-3">
                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[o.status] ?? 'bg-gray-50 text-gray-600')}>
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold">{formatCurrency(Number(o.totalNgn))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null
      )}

      {/* ── Orders Tab ── */}
      {tab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Order #</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Amount</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Date</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{order.orderNumber}</td>
                    <td className="px-5 py-3 text-gray-700">{order.user?.fullName || order.user?.phone || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600')}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(Number(order.totalNgn))}</td>
                    <td className="px-5 py-3 text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block">
                        <select
                          value={order.status}
                          disabled={updatingStatus === order.id}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 pr-6 appearance-none bg-gray-50 text-gray-700 disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Vendors Tab ── */}
      {tab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Business</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Market</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Products</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Orders</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Rating</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendors.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{v.businessName}</td>
                    <td className="px-5 py-3 text-gray-500">{v.market.name}</td>
                    <td className="px-5 py-3 text-gray-700">{v._count.products}</td>
                    <td className="px-5 py-3 text-gray-700">{v._count.orderItems}</td>
                    <td className="px-5 py-3 text-gray-700">{v.ratingAverage ? `${parseFloat(String(v.ratingAverage)).toFixed(1)} ★` : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <select
                        value={v.verificationStatus}
                        onChange={e => handleVendorVerification(v.id, e.target.value)}
                        className={cn('text-xs border rounded-lg px-2 py-1.5 appearance-none font-semibold',
                          v.verificationStatus === 'VERIFIED'  ? 'border-green-200 bg-green-50 text-green-700' :
                          v.verificationStatus === 'SUSPENDED' ? 'border-red-200 bg-red-50 text-red-700' :
                          'border-amber-200 bg-amber-50 text-amber-700'
                        )}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="VERIFIED">VERIFIED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {vendors.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">No vendors found</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );
}
