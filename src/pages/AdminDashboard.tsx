import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { TrendingUp, Package, Users, ShoppingBag, ChevronDown, Download, Tag, ToggleLeft, ToggleRight, Plus, ClipboardList, Store, Clock, MapPin, Truck, Settings, Sparkles } from 'lucide-react';
import AdminProductApprovalTab from './AdminProductApprovalTab';
import AdminSettingsTab from './AdminSettingsTab';
import AdminDeliveryZonesTab from './AdminDeliveryZonesTab';
import AdminDeliveryRatesTab from './AdminDeliveryRatesTab';
import AdminGroupBuyTab from './AdminGroupBuyTab';
import AdminDisputesPayoutsTab from './AdminDisputesPayoutsTab';
import AdminCleaningTab from './AdminCleaningTab';

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

interface PromoCode {
  id: string;
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  description: string | null;
  minOrderNgn: number | null;
  maxUsesTotal: number | null;
  usedCount: number;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;   // Prisma field name
}

const ORDER_STATUSES = ['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'SOURCING', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
// Valid next states for each status — prevents admin from jumping to nonsensical transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT:   ['PAYMENT_CONFIRMED', 'CANCELLED'],
  PAYMENT_CONFIRMED: ['SOURCING', 'CANCELLED'],
  SOURCING:          ['AT_HUB', 'CANCELLED'],
  AT_HUB:            ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY:  ['DELIVERED'],
  DELIVERED:         [],
  CANCELLED:         [],
};
const STATUS_COLORS: Record<string, string> = {
  DELIVERED:         'text-green-700 bg-green-50',
  PAYMENT_CONFIRMED: 'text-blue-700 bg-blue-50',
  SOURCING:          'text-amber-700 bg-amber-50',
  AT_HUB:            'text-purple-700 bg-purple-50',
  OUT_FOR_DELIVERY:  'text-indigo-700 bg-indigo-50',
  PENDING_PAYMENT:   'text-amber-700 bg-amber-50',
  CANCELLED:         'text-red-700 bg-red-50',
};

type Tab = 'reports' | 'orders' | 'vendors' | 'promos' | 'approvals' | 'markets' | 'zones' | 'rates' | 'settings' | 'group-buy' | 'disputes-payouts' | 'cleaning';

interface RunDay {
  id?: string;
  dayOfWeek: number;
  cutoffHour: number;
  cutoffMinute: number;
  isMasterConsolidation: boolean;
}

interface MarketWithRunDays {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  runDays: RunDay[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const validTabs: Tab[] = ['reports','orders','vendors','promos','approvals','markets','zones','rates','settings','group-buy','disputes-payouts','cleaning'];
  const [tab, setTabState] = useState<Tab>(tabParam && validTabs.includes(tabParam) ? tabParam : 'reports');

  const setTab = (t: Tab) => {
    setTabState(t);
    setSearchParams(prev => { prev.set('tab', t); return prev; }, { replace: true });
  };

  const [reports, setReports] = useState<Reports | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [markets, setMarkets] = useState<MarketWithRunDays[]>([]);
  const [editingMarket, setEditingMarket] = useState<MarketWithRunDays | null>(null);
  const [savingMarket, setSavingMarket] = useState(false);
  const [showAddMarket, setShowAddMarket] = useState(false);
  const [addMarketForm, setAddMarketForm] = useState({ name: '', category: '', imageUrl: '', lat: '', lng: '', isActive: false });
  const [addingMarket, setAddingMarket] = useState(false);
  const [loadingReports, setLoadingReports] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: '', discountType: 'FIXED', discountValue: '', description: '', minOrderNgn: '', maxUsesTotal: '', validFrom: '', validUntil: '' });
  // Orders tab filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  // Generate verification code modal
  const [codeModal, setCodeModal] = useState<{ orderId: string; orderNumber: string; code?: string } | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { navigate('/'); return; }
    loadReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  useEffect(() => {
    if (tab === 'orders' && orders.length === 0) loadOrders();
    if (tab === 'vendors' && vendors.length === 0) loadVendors();
    if (tab === 'promos' && promos.length === 0) loadPromos();
    if (tab === 'markets' && markets.length === 0) loadMarkets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const { data } = await axios.get('/admin/orders', { params: { limit: 50 } });
      setOrders(data.orders ?? data); // handle paginated { orders } or plain array
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
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleGenerateCode = async () => {
    if (!codeModal) return;
    setGeneratingCode(true);
    try {
      const { data } = await axios.post('/admin/orders/generate-code', { orderId: codeModal.orderId });
      setCodeModal(prev => prev ? { ...prev, code: data.code } : null);
      showToast('Verification code generated', 'success');
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Failed to generate code', 'error');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const params: Record<string, string> = {};
      if (exportFrom) params.from = new Date(exportFrom).toISOString();
      if (exportTo)   params.to   = new Date(exportTo + 'T23:59:59').toISOString();
      const res = await axios.get('/admin/reports/export', { responseType: 'blob', params });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ayanfe-orders-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('CSV exported successfully', 'success');
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Failed to export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const loadPromos = async () => {
    try {
      const { data } = await axios.get('/admin/promos');
      setPromos(data);
    } catch {
      showToast('Failed to load promo codes', 'error');
    }
  };

  const loadMarkets = async () => {
    try {
      const { data } = await axios.get('/admin/markets');
      setMarkets(data);
    } catch {
      showToast('Failed to load markets', 'error');
    }
  };

  const openMarketEditor = (market: MarketWithRunDays) => {
    setEditingMarket(JSON.parse(JSON.stringify(market)));
  };

  const toggleRunDay = (dayOfWeek: number) => {
    if (!editingMarket) return;
    const exists = editingMarket.runDays.find(d => d.dayOfWeek === dayOfWeek);
    if (exists) {
      setEditingMarket({ ...editingMarket, runDays: editingMarket.runDays.filter(d => d.dayOfWeek !== dayOfWeek) });
    } else {
      setEditingMarket({
        ...editingMarket,
        runDays: [...editingMarket.runDays, { dayOfWeek, cutoffHour: 20, cutoffMinute: 0, isMasterConsolidation: false }]
      });
    }
  };

  const updateRunDay = (dayOfWeek: number, field: keyof RunDay, value: number | boolean) => {
    if (!editingMarket) return;
    setEditingMarket({
      ...editingMarket,
      runDays: editingMarket.runDays.map(d => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)
    });
  };

  const saveMarketRunDays = async () => {
    if (!editingMarket) return;
    setSavingMarket(true);
    try {
      const { data } = await axios.put(`/admin/markets/${editingMarket.id}/run-days`, {
        runDays: editingMarket.runDays.map(d => ({
          dayOfWeek: d.dayOfWeek,
          cutoffHour: d.cutoffHour,
          cutoffMinute: d.cutoffMinute,
          isMasterConsolidation: d.isMasterConsolidation
        }))
      });
      setMarkets(prev => prev.map(m => m.id === editingMarket.id ? data.market : m));
      setEditingMarket(null);
      showToast('Market schedule updated', 'success');
    } catch {
      showToast('Failed to save schedule', 'error');
    } finally {
      setSavingMarket(false);
    }
  };

  const handleAddMarket = async () => {
    if (!addMarketForm.name || !addMarketForm.category) {
      showToast('Name and category are required', 'error'); return;
    }
    setAddingMarket(true);
    try {
      const { data } = await axios.post('/admin/markets', {
        name: addMarketForm.name,
        category: addMarketForm.category,
        imageUrl: addMarketForm.imageUrl || undefined,
        lat: addMarketForm.lat ? parseFloat(addMarketForm.lat) : undefined,
        lng: addMarketForm.lng ? parseFloat(addMarketForm.lng) : undefined,
        isActive: addMarketForm.isActive
      });
      setMarkets(prev => [...prev, { ...data, runDays: [] }]);
      setShowAddMarket(false);
      setAddMarketForm({ name: '', category: '', imageUrl: '', lat: '', lng: '', isActive: false });
      showToast('Market created', 'success');
    } catch (e) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : undefined;
      showToast(msg || 'Failed to create market', 'error');
    } finally { setAddingMarket(false); }
  };

  const handleTogglePromo = async (id: string) => {
    try {
      const { data } = await axios.patch(`/admin/promos/${id}/toggle`);
      setPromos(prev => prev.map(p => p.id === id ? { ...p, isActive: data.promo.isActive } : p));
      showToast(`Promo ${data.promo.isActive ? 'enabled' : 'disabled'}`, 'success');
    } catch {
      showToast('Failed to toggle promo', 'error');
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: promoForm.code.trim().toUpperCase(),
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue),
        description: promoForm.description || undefined,
        minOrderNgn: promoForm.minOrderNgn ? Number(promoForm.minOrderNgn) : undefined,
        maxUsesTotal: promoForm.maxUsesTotal ? Number(promoForm.maxUsesTotal) : undefined,
        validFrom: promoForm.validFrom || undefined,
        validUntil: promoForm.validUntil || undefined,
      };
      const { data } = await axios.post('/admin/promos', payload);
      setPromos(prev => [data.promo, ...prev]);
      setShowPromoForm(false);
      setPromoForm({ code: '', discountType: 'FIXED', discountValue: '', description: '', minOrderNgn: '', maxUsesTotal: '', validFrom: '', validUntil: '' });
      showToast('Promo code created', 'success');
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Failed to create promo', 'error');
    }
  };

  const [updatingVendor, setUpdatingVendor] = useState<string | null>(null);
  const handleVendorVerification = async (vendorId: string, status: string) => {
    setUpdatingVendor(vendorId);
    try {
      await axios.patch('/admin/vendors/verification', { vendorId, status });
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, verificationStatus: status } : v));
      showToast('Vendor status updated', 'success');
    } catch {
      showToast('Failed to update vendor', 'error');
    } finally {
      setUpdatingVendor(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        {/* Quick Create Links */}
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/vendors/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors">
            <Plus size={12} /> Vendor
          </Link>
          <Link to="/admin/artisans/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
            <Plus size={12} /> Artisan
          </Link>
          <Link to="/admin/products/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-colors">
            <Plus size={12} /> Product
          </Link>
          <Link to="/admin/shortlets/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold hover:bg-orange-100 transition-colors">
            <Plus size={12} /> Shortlet
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'reports', label: 'Reports' },
          { key: 'orders', label: 'Orders' },
          { key: 'vendors', label: 'Vendors' },
          { key: 'promos', label: 'Promos' },
          { key: 'approvals', label: 'Approvals', icon: <ClipboardList size={14} /> },
          { key: 'markets', label: 'Markets', icon: <Store size={14} /> },
          { key: 'zones', label: 'Zones', icon: <MapPin size={14} /> },
          { key: 'rates', label: 'Delivery Rates', icon: <Truck size={14} /> },
          { key: 'group-buy', label: 'Group Buys', icon: <Users size={14} /> },
          { key: 'disputes-payouts', label: 'Disputes & Payouts', icon: <ClipboardList size={14} /> },
          { key: 'cleaning', label: 'Cleaning', icon: <Sparkles size={14} /> },
          { key: 'settings', label: 'Settings', icon: <Settings size={14} /> },
        ] as { key: Tab; label: string; icon?: React.ReactNode }[]).map(({ key, label, icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize transition flex items-center gap-1.5',
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            )}>
            {icon}
            {label}
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
              <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-gray-900">Recent Orders</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    title="Export from date" />
                  <span className="text-xs text-gray-400">→</span>
                  <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    title="Export to date" />
                  <button
                    onClick={handleExportCSV}
                    disabled={isExporting}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={15} />
                    {isExporting ? 'Exporting…' : 'Export CSV'}
                  </button>
                </div>
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
      {tab === 'orders' && (() => {
        const filteredOrders = orders.filter(o => {
          const matchStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
          const q = orderSearch.toLowerCase();
          const matchSearch = !q || o.orderNumber.toLowerCase().includes(q)
            || (o.user?.fullName ?? '').toLowerCase().includes(q)
            || (o.user?.phone ?? '').includes(q);
          return matchStatus && matchSearch;
        });
        return (
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Search order #, customer…"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="ALL">All statuses</option>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
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
                      <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredOrders.map(order => (
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
                          <div className="flex items-center justify-end gap-2">
                            {order.status === 'OUT_FOR_DELIVERY' && (
                              <button
                                onClick={() => setCodeModal({ orderId: order.id, orderNumber: order.orderNumber })}
                                className="text-xs font-semibold px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap"
                                title="Generate delivery verification code"
                              >
                                Get Code
                              </button>
                            )}
                            {(() => {
                              const nextStatuses = VALID_TRANSITIONS[order.status] ?? [];
                              return nextStatuses.length > 0 ? (
                                <div className="relative inline-block">
                                  <select
                                    value=""
                                    disabled={updatingStatus === order.id}
                                    onChange={e => { if (e.target.value) handleStatusChange(order.id, e.target.value); }}
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 pr-6 appearance-none bg-gray-50 text-gray-700 disabled:opacity-50"
                                  >
                                    <option value="" disabled>Move to…</option>
                                    {nextStatuses.map(s => (
                                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic px-2">Final</span>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Promos Tab ── */}
      {tab === 'promos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Promo Codes</h2>
            <button
              onClick={() => setShowPromoForm(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition"
            >
              <Plus size={15} /> New Promo
            </button>
          </div>

          {showPromoForm && (
            <form onSubmit={handleCreatePromo} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Code *</label>
                <input required value={promoForm.code} onChange={e => setPromoForm(p => ({ ...p, code: e.target.value }))}
                  placeholder="SAVE20" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase tracking-widest" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Type *</label>
                <select value={promoForm.discountType} onChange={e => setPromoForm(p => ({ ...p, discountType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                  <option value="FIXED">Fixed (₦)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Value *</label>
                <input required type="number" min="1" value={promoForm.discountValue} onChange={e => setPromoForm(p => ({ ...p, discountValue: e.target.value }))}
                  placeholder={promoForm.discountType === 'FIXED' ? '500' : '15'} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Min Order (₦)</label>
                <input type="number" min="0" value={promoForm.minOrderNgn} onChange={e => setPromoForm(p => ({ ...p, minOrderNgn: e.target.value }))}
                  placeholder="Optional" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Max Uses</label>
                <input type="number" min="1" value={promoForm.maxUsesTotal} onChange={e => setPromoForm(p => ({ ...p, maxUsesTotal: e.target.value }))}
                  placeholder="Unlimited" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Valid From</label>
                <input type="date" value={promoForm.validFrom} onChange={e => setPromoForm(p => ({ ...p, validFrom: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Valid Until</label>
                <input type="date" value={promoForm.validUntil} onChange={e => setPromoForm(p => ({ ...p, validUntil: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <input value={promoForm.description} onChange={e => setPromoForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Optional label shown to users" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
              </div>
              <div className="col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowPromoForm(false)} className="text-sm text-gray-500 hover:text-gray-800 transition px-4 py-2">Cancel</button>
                <button type="submit" className="text-sm font-semibold bg-black text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition">Create</button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Code</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Type</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Value</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Min Order</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Uses</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Expires</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {promos.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Tag size={13} className="text-gray-400" />
                          <span className="font-mono font-bold text-gray-900 tracking-wider">{p.code}</span>
                          {p.description && <span className="text-xs text-gray-400">{p.description}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{p.discountType}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        {p.discountType === 'FIXED' ? formatCurrency(Number(p.discountValue)) : `${p.discountValue}%`}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{p.minOrderNgn ? formatCurrency(Number(p.minOrderNgn)) : '—'}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {p.usedCount}{p.maxUsesTotal ? ` / ${p.maxUsesTotal}` : ''}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">
                        {p.validTo ? new Date(p.validTo).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleTogglePromo(p.id)}
                          className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ml-auto',
                            p.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          )}>
                          {p.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          {p.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {promos.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No promo codes yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
                        disabled={updatingVendor === v.id}
                        className={cn('text-xs border rounded-lg px-2 py-1.5 appearance-none font-semibold disabled:opacity-50 disabled:cursor-wait',
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

      {/* ── Product Approvals Tab ── */}
      {tab === 'approvals' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Product Approvals</h2>
              <p className="text-sm text-gray-500 mt-0.5">Review and approve vendor-submitted products</p>
            </div>
          </div>
          <AdminProductApprovalTab />
        </div>
      )}

      {/* ── Markets Tab ── */}
      {tab === 'markets' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Market Schedules</h2>
              <p className="text-sm text-gray-500 mt-0.5">Set delivery days and order cutoff times for each market</p>
            </div>
            <button onClick={() => setShowAddMarket(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark">
              <Plus size={15} /> Add Market
            </button>
          </div>
          <div className="space-y-3">
            {markets.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No markets found</p>}
            {markets.map(market => (
              <div key={market.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">{market.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{market.category}</p>
                  {market.runDays.length === 0 ? (
                    <p className="text-xs text-amber-600 mt-1">No delivery days set</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {market.runDays.map(d => (
                        <span key={d.dayOfWeek} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.dayOfWeek]}
                          <span className="text-primary/70">
                            · cutoff {String(d.cutoffHour).padStart(2,'0')}:{String(d.cutoffMinute).padStart(2,'0')}
                          </span>
                          {d.isMasterConsolidation && <span className="ml-0.5 text-primary/50">(master)</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openMarketEditor(market)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Clock size={13} />
                  Edit Schedule
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Delivery Zones Tab ── */}
      {tab === 'zones' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <AdminDeliveryZonesTab />
        </div>
      )}

      {/* ── Delivery Rates Tab ── */}
      {tab === 'rates' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <AdminDeliveryRatesTab />
        </div>
      )}

      {/* ── Group Buy Tab ── */}
      {tab === 'group-buy' && (
        <AdminGroupBuyTab />
      )}

      {/* ── Disputes & Payouts Tab ── */}
      {tab === 'disputes-payouts' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <AdminDisputesPayoutsTab />
        </div>
      )}

      {/* ── Cleaning Tab ── */}
      {tab === 'cleaning' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Cleaning Requests</h2>
              <p className="text-sm text-gray-500 mt-0.5">Review submissions, send quotes & manage assignments</p>
            </div>
          </div>
          <AdminCleaningTab />
        </div>
      )}

      {/* ── Settings Tab ── */}
      {tab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Platform Settings</h2>
          <AdminSettingsTab />
        </div>
      )}

      {/* ── Add Market Modal ── */}
      {showAddMarket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Add New Market</h3>
              <button onClick={() => setShowAddMarket(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <span className="text-gray-400 text-lg leading-none">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Market Name *</label>
                <input
                  value={addMarketForm.name}
                  onChange={e => setAddMarketForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Oyingbo Market"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                <input
                  value={addMarketForm.category}
                  onChange={e => setAddMarketForm(p => ({ ...p, category: e.target.value }))}
                  placeholder="e.g., Foodstuff & Groceries"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Image URL</label>
                <input
                  value={addMarketForm.imageUrl}
                  onChange={e => setAddMarketForm(p => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://…"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    value={addMarketForm.lat}
                    onChange={e => setAddMarketForm(p => ({ ...p, lat: e.target.value }))}
                    placeholder="6.5244"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    value={addMarketForm.lng}
                    onChange={e => setAddMarketForm(p => ({ ...p, lng: e.target.value }))}
                    placeholder="3.3792"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addMarketForm.isActive}
                  onChange={e => setAddMarketForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm font-semibold text-gray-700">Active (visible to customers)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddMarket(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMarket}
                disabled={addingMarket}
                className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 text-sm"
              >
                {addingMarket ? 'Creating…' : 'Create Market'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Verification Code Modal ── */}
      {codeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Delivery Verification Code</h3>
                <p className="text-xs text-gray-400 mt-0.5">{codeModal.orderNumber}</p>
              </div>
              <button onClick={() => setCodeModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <span className="text-gray-400 text-lg leading-none">×</span>
              </button>
            </div>
            {codeModal.code ? (
              <div>
                <p className="text-xs text-gray-500 mb-3">Share this code with the delivery agent. The customer must enter it to confirm receipt.</p>
                <div className="text-center py-6 bg-indigo-50 rounded-xl mb-4">
                  <span className="text-5xl font-black tracking-[0.3em] text-indigo-700">{codeModal.code}</span>
                </div>
                <p className="text-xs text-gray-400 text-center">This code is valid until the customer confirms delivery.</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-5">Generate a 6-digit code for the delivery agent. The customer will enter this code in the app to confirm they received their order.</p>
                <button
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generatingCode ? '…Generating' : 'Generate Code'}
                </button>
              </div>
            )}
            <button onClick={() => setCodeModal(null)} className="w-full mt-3 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 text-sm">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Market Schedule Editor Modal ── */}
      {editingMarket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editingMarket.name}</h3>
                <p className="text-sm text-gray-400">Set delivery days and order cutoff times</p>
              </div>
              <button onClick={() => setEditingMarket(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="text-gray-400 text-lg leading-none">×</span>
              </button>
            </div>

            <div className="space-y-3">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((dayName, i) => {
                const runDay = editingMarket.runDays.find(d => d.dayOfWeek === i);
                const active = !!runDay;
                return (
                  <div key={i} className={cn('border rounded-xl p-4 transition-colors', active ? 'border-primary/30 bg-primary/5' : 'border-gray-100')}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRunDay(i)}
                        className={cn('w-10 h-6 rounded-full transition-colors flex-shrink-0', active ? 'bg-primary' : 'bg-gray-200')}
                      >
                        <span className={cn('block w-4 h-4 bg-white rounded-full mx-auto transition-transform shadow-sm', active ? 'translate-x-5' : 'translate-x-0')} />
                      </button>
                      <span className="font-semibold text-gray-900 w-10">{dayName}</span>
                      {active && (
                        <div className="flex items-center gap-2 ml-auto flex-wrap">
                          <label className="text-xs text-gray-500">Cutoff</label>
                          <select
                            value={runDay.cutoffHour}
                            onChange={e => updateRunDay(i, 'cutoffHour', parseInt(e.target.value))}
                            className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {Array.from({ length: 24 }, (_, h) => (
                              <option key={h} value={h}>
                                {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                              </option>
                            ))}
                          </select>
                          <select
                            value={runDay.cutoffMinute}
                            onChange={e => updateRunDay(i, 'cutoffMinute', parseInt(e.target.value))}
                            className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {[0, 15, 30, 45].map(m => (
                              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
                            <input
                              type="checkbox"
                              checked={runDay.isMasterConsolidation}
                              onChange={e => updateRunDay(i, 'isMasterConsolidation', e.target.checked)}
                              className="rounded"
                            />
                            Master
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 mt-4">Cutoff = latest time customers can place orders for this delivery day. "Master" = consolidation run.</p>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingMarket(null)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={saveMarketRunDays} disabled={savingMarket} className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50">
                {savingMarket ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
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
