import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { formatCurrency, cn } from '../lib/utils';
import {
  Package, ShoppingBag, Star, TrendingUp,
  ToggleLeft, ToggleRight, ChevronDown, Plus, Pencil, X, Check,
} from 'lucide-react';

interface VendorStats {
  vendor: {
    id: string;
    businessName: string;
    verificationStatus: string;
    ratingAverage: string | null;
    totalOrdersFulfilled: number;
  };
  stats: {
    activeProducts: number;
    totalOrderItems: number;
    totalRevenue: string | number;
    ratingAverage: string | null;
    totalOrdersFulfilled: number;
  };
  recentReviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { fullName: string | null };
  }[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  unit: string;
  isActive: boolean;
  stockQuantity: number | null;
  reservedQuantity: number;
  priceEntries: { priceNgn: number }[];
  category: { name: string } | null;
  _count: { orderItems: number };
  approvalStatus?: string;
  rejectionReason?: string;
}

interface EditState {
  productId: string | null;
  name: string;
  description: string;
  unit: string;
  newPrice: string;
  stockQuantity: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPriceNgn: string | number;
  totalPriceNgn: string | number;
  product: { name: string; unit: string };
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    user: { fullName: string | null; phone: string };
  };
}

const STATUS_COLORS: Record<string, string> = {
  PAYMENT_CONFIRMED: 'text-blue-700 bg-blue-50',
  SOURCING:          'text-amber-700 bg-amber-50',
  AT_HUB:            'text-purple-700 bg-purple-50',
  OUT_FOR_DELIVERY:  'text-indigo-700 bg-indigo-50',
  DELIVERED:         'text-green-700 bg-green-50',
  CANCELLED:         'text-red-700 bg-red-50',
};

const VERIFICATION_STYLE: Record<string, string> = {
  VERIFIED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
};

type Tab = 'overview' | 'products' | 'orders';

const stagger: { container: Variants; item: Variants } = {
  container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } } },
};

export default function VendorDashboard() {
  const { user }     = useAuth();
  const { showToast } = useToast();
  const navigate     = useNavigate();

  const [tab,         setTab]         = useState<Tab>('overview');
  const [statsData,   setStatsData]   = useState<VendorStats | null>(null);
  const [products,    setProducts]    = useState<Product[]>([]);
  const [orderItems,  setOrderItems]  = useState<OrderItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editState,   setEditState]   = useState<EditState>({
    productId: null, name: '', description: '', unit: '', newPrice: '', stockQuantity: ''
  });
  const [savingEdit,  setSavingEdit]  = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get('/vendors/me/stats')
      .then(r => setStatsData(r.data))
      .catch(() => { showToast('No vendor profile linked to your account', 'error'); navigate('/'); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  useEffect(() => {
    if (tab === 'products' && products.length === 0) {
      axios.get('/vendors/me/products')
        .then(r => setProducts(r.data))
        .catch(() => showToast('Failed to load products', 'error'));
    }
    if (tab === 'orders' && orderItems.length === 0) {
      axios.get('/vendors/me/orders')
        .then(r => setOrderItems(r.data))
        .catch(() => showToast('Failed to load orders', 'error'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const toggleProduct = async (product: Product) => {
    try {
      await axios.patch(`/vendors/me/products/${product.id}`, { isActive: !product.isActive });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
      showToast(`"${product.name}" ${product.isActive ? 'deactivated' : 'activated'}`, 'success');
    } catch {
      showToast('Failed to update product', 'error');
    }
  };

  const openEdit = (product: Product) => {
    const currentPrice = product.priceEntries[0]?.priceNgn ?? 0;
    setEditState({
      productId: product.id,
      name: product.name,
      description: product.description || '',
      unit: product.unit,
      newPrice: String(currentPrice),
      stockQuantity: product.stockQuantity !== null ? String(product.stockQuantity) : ''
    });
  };

  const closeEdit = () => setEditState(prev => ({ ...prev, productId: null }));

  const saveEdit = async () => {
    if (!editState.productId) return;
    setSavingEdit(true);
    try {
      const product = products.find(p => p.id === editState.productId)!;
      const currentPrice = product.priceEntries[0]?.priceNgn ?? 0;
      const newPriceNum = parseFloat(editState.newPrice);

      // Update product details
      await axios.patch(`/vendors/me/products/${editState.productId}`, {
        name: editState.name,
        description: editState.description,
        unit: editState.unit,
      });

      // Update price if changed
      if (!isNaN(newPriceNum) && newPriceNum > 0 && newPriceNum !== Number(currentPrice)) {
        await axios.patch(`/vendors/me/products/${editState.productId}/price`, {
          priceNgn: newPriceNum
        });
      }

      // Update stock if changed
      const newStock = editState.stockQuantity ? parseInt(editState.stockQuantity) : null;
      if (newStock !== product.stockQuantity) {
        await axios.patch(`/vendors/me/products/${editState.productId}`, {
          stockQuantity: newStock ?? undefined
        });
      }

      // Refresh the product in local state
      setProducts(prev => prev.map(p => {
        if (p.id !== editState.productId) return p;
        return {
          ...p,
          name: editState.name,
          description: editState.description,
          unit: editState.unit,
          stockQuantity: newStock,
          priceEntries: [{ priceNgn: newPriceNum || Number(currentPrice) }]
        };
      }));

      showToast('Product updated successfully', 'success');
      closeEdit();
    } catch {
      showToast('Failed to update product', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
    );
  }

  if (!statsData) return null;

  const { stats, vendor, recentReviews } = statsData;
  const verificationStyle = VERIFICATION_STYLE[vendor.verificationStatus] ?? 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-black text-ink tracking-tight">{vendor.businessName}</h1>
          <p className="text-muted text-sm mt-1">Vendor Dashboard</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${verificationStyle}`}>
          <span className={cn('size-1.5 rounded-full', vendor.verificationStatus === 'VERIFIED' ? 'bg-emerald-500' : vendor.verificationStatus === 'SUSPENDED' ? 'bg-red-500' : 'bg-amber-500')} />
          {vendor.verificationStatus}
        </span>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-1 mb-8 bg-surface p-1 rounded-2xl w-fit border border-gray-100"
      >
        {(['overview', 'products', 'orders'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors',
              tab === t ? 'text-ink' : 'text-muted hover:text-ink'
            )}
          >
            {tab === t && (
              <motion.div
                layoutId="vendor-tab"
                className="absolute inset-0 bg-white shadow-sm rounded-xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Stat cards */}
            <motion.div
              variants={stagger.container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard icon={<Package size={20} />} label="Active Products"  value={stats.activeProducts} color="text-primary" />
              <StatCard icon={<ShoppingBag size={20} />} label="Total Orders"  value={stats.totalOrderItems} color="text-indigo-600" />
              <StatCard icon={<TrendingUp size={20} />} label="Revenue"        value={formatCurrency(Number(stats.totalRevenue))} color="text-emerald-600" />
              <StatCard icon={<Star size={20} />}        label="Rating"         value={stats.ratingAverage ? `${parseFloat(String(stats.ratingAverage)).toFixed(1)} ★` : '—'} color="text-amber-500" />
            </motion.div>

            {/* Recent reviews */}
            {recentReviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
              >
                <h3 className="font-black text-ink mb-5">Recent Reviews</h3>
                <div className="space-y-4">
                  {recentReviews.map(r => (
                    <div key={r.id} className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="size-9 rounded-2xl bg-surface flex items-center justify-center text-sm font-black text-primary shrink-0">
                        {(r.user.fullName ?? 'C')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-bold text-ink">{r.user.fullName || 'Customer'}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <span key={s} className={cn('text-sm', s <= r.rating ? 'text-amber-400' : 'text-gray-200')}>★</span>
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-xs text-muted leading-relaxed">{r.comment}</p>}
                        <p className="text-xs text-muted/60 mt-1">{new Date(r.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Products ── */}
        {tab === 'products' && (
          <motion.div key="products" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Upload button */}
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/vendor/upload-product')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors text-sm"
              >
                <Plus size={16} />
                Upload Product
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              {products.length === 0 ? (
                <div className="py-20 text-center">
                  <Package size={32} className="mx-auto mb-3 text-muted opacity-40" />
                  <p className="text-muted font-medium">No products yet</p>
                  <p className="text-xs text-muted mt-1">Click "Upload Product" to add your first product</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Product</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Price</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Orders</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.map(p => {
                        const available = p.stockQuantity !== null
                          ? p.stockQuantity - p.reservedQuantity
                          : null;
                        const isPending  = p.approvalStatus === 'PENDING_APPROVAL';
                        const isRejected = p.approvalStatus === 'REJECTED';
                        return (
                          <tr key={p.id} className={cn('hover:bg-surface/60 transition-colors', !p.isActive && 'opacity-50')}>
                            <td className="px-6 py-4">
                              <p className="font-bold text-ink">{p.name}</p>
                              <p className="text-xs text-muted">per {p.unit}</p>
                            </td>
                            <td className="px-6 py-4 text-muted">{p.category?.name ?? '—'}</td>
                            <td className="px-6 py-4 font-bold text-primary">
                              {p.priceEntries[0] ? formatCurrency(Number(p.priceEntries[0].priceNgn)) : '—'}
                            </td>
                            <td className="px-6 py-4">
                              {available === null ? (
                                <span className="text-xs text-muted">Unlimited</span>
                              ) : (
                                <span className={cn('text-xs font-bold', available <= 5 ? 'text-red-600' : 'text-ink')}>
                                  {available} left
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700">
                                  ⏳ Pending
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700" title={p.rejectionReason || ''}>
                                  ❌ Rejected
                                </span>
                              )}
                              {!isPending && !isRejected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                                  ✓ Live
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-muted">{p._count.orderItems}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEdit(p)}
                                  className="p-1.5 rounded-lg text-muted hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  title="Edit product"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => toggleProduct(p)}
                                  className="transition-colors"
                                  title={p.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {p.isActive
                                    ? <ToggleRight size={24} className="text-primary hover:text-primary-dark" />
                                    : <ToggleLeft  size={24} className="text-muted hover:text-ink" />
                                  }
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
              {editState.productId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={closeEdit}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-black text-ink">Edit Product</h3>
                      <button onClick={closeEdit} className="p-2 rounded-xl text-muted hover:bg-gray-100">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-1.5">Product Name</label>
                        <input
                          type="text"
                          value={editState.name}
                          onChange={e => setEditState(s => ({ ...s, name: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-1.5">Description</label>
                        <textarea
                          value={editState.description}
                          onChange={e => setEditState(s => ({ ...s, description: e.target.value }))}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                        />
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-1.5">Unit</label>
                        <input
                          type="text"
                          value={editState.unit}
                          onChange={e => setEditState(s => ({ ...s, unit: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          placeholder="kg, piece, dozen…"
                        />
                      </div>

                      {/* Price (highlighted) */}
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                        <label className="block text-xs font-bold text-primary uppercase mb-1.5">Price (₦)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-primary font-bold text-sm">₦</span>
                          <input
                            type="number"
                            value={editState.newPrice}
                            onChange={e => setEditState(s => ({ ...s, newPrice: e.target.value }))}
                            step="0.01"
                            className="w-full pl-8 pr-4 py-2.5 border border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold"
                          />
                        </div>
                        <p className="text-xs text-primary/70 mt-1">Changing price creates a new price entry</p>
                      </div>

                      {/* Stock */}
                      <div>
                        <label className="block text-xs font-bold text-muted uppercase mb-1.5">Stock Quantity</label>
                        <input
                          type="number"
                          value={editState.stockQuantity}
                          onChange={e => setEditState(s => ({ ...s, stockQuantity: e.target.value }))}
                          placeholder="Leave blank for unlimited"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={closeEdit}
                        className="flex-1 px-4 py-2.5 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={savingEdit}
                        className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 text-sm inline-flex items-center justify-center gap-2"
                      >
                        {savingEdit ? 'Saving…' : (<><Check size={15} /> Save Changes</>)}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Orders ── */}
        {tab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {orderItems.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-gray-100">
                <ShoppingBag size={32} className="mx-auto mb-3 text-muted opacity-40" />
                <p className="text-muted font-medium">No orders yet</p>
              </div>
            ) : (
              orderItems.map(item => {
                const isExpanded = expandedRow === item.id;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div
                      className="p-5 flex items-center gap-4 cursor-pointer hover:bg-surface/40 transition-colors"
                      onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-ink">{item.product.name}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {item.order.orderNumber} · {item.order.user.fullName || item.order.user.phone}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-ink">{formatCurrency(Number(item.totalPriceNgn))}</p>
                        <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block',
                          STATUS_COLORS[item.order.status] ?? 'bg-gray-50 text-gray-600'
                        )}>
                          {item.order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={16} className="text-muted" />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-gray-100"
                        >
                          <div className="px-5 py-4 bg-surface/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted mb-0.5">Quantity</p>
                              <p className="font-bold text-ink">{Number(item.quantity)} {item.product.unit}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted mb-0.5">Unit price</p>
                              <p className="font-bold text-ink">{formatCurrency(Number(item.unitPriceNgn))}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted mb-0.5">Order date</p>
                              <p className="font-bold text-ink">{new Date(item.order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted mb-0.5">Customer</p>
                              <p className="font-bold text-ink truncate">{item.order.user.fullName || item.order.user.phone}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <motion.div variants={stagger.item} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn('size-10 rounded-xl bg-current/10 flex items-center justify-center', color)}>
          <div className={color}>{icon}</div>
        </div>
        <p className="text-xs font-bold text-muted uppercase tracking-wider leading-tight">{label}</p>
      </div>
      <p className="text-2xl font-black text-ink">{value}</p>
    </motion.div>
  );
}
