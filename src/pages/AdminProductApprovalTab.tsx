import { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';

interface PendingProduct {
  id: string;
  name: string;
  description?: string;
  unit: string;
  imageUrls: string[];
  vendor: { id: string; businessName: string };
  category?: { name: string };
  currentPrice?: number;
  createdAt: string;
}

interface Market { id: string; name: string }
interface Vendor { id: string; businessName: string }

export default function AdminProductApprovalTab() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [filters, setFilters] = useState({ marketId: '', vendorId: '' });

  const limit = 20;

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/marketplace`, { credentials: 'include' })
      .then(r => r.json())
      .then(setMarkets)
      .catch(() => {});

    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors`, { credentials: 'include' })
      .then(r => r.json())
      .then(setVendors)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    fetchPendingProducts();
  }, [page, filters]);

  const fetchPendingProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(filters.marketId ? { marketId: filters.marketId } : {}),
        ...(filters.vendorId ? { vendorId: filters.vendorId } : {})
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/products/pending?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.products);
      setTotal(data.total);
    } catch {
      showToast('Failed to load pending products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/products/${productId}/approval`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ approvalStatus: 'APPROVED' })
        }
      );
      if (!response.ok) throw new Error('Failed to approve');
      showToast('Product approved', 'success');
      setProducts(prev => prev.filter(p => p.id !== productId));
      setTotal(prev => prev - 1);
    } catch {
      showToast('Failed to approve product', 'error');
    }
  };

  const handleReject = async () => {
    if (!selectedProduct || !rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/products/${selectedProduct}/approval`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ approvalStatus: 'REJECTED', rejectionReason })
        }
      );
      if (!response.ok) throw new Error('Failed to reject');
      showToast('Product rejected', 'success');
      setProducts(prev => prev.filter(p => p.id !== selectedProduct));
      setTotal(prev => prev - 1);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedProduct(null);
    } catch {
      showToast('Failed to reject product', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.marketId}
          onChange={e => setFilters(prev => ({ ...prev, marketId: e.target.value, vendorId: '' }))}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Markets</option>
          {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select
          value={filters.vendorId}
          onChange={e => setFilters(prev => ({ ...prev, vendorId: e.target.value }))}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Vendors</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.businessName}</option>)}
        </select>

        {(filters.marketId || filters.vendorId) && (
          <button
            onClick={() => setFilters({ marketId: '', vendorId: '' })}
            className="px-3 py-2 text-sm text-muted border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-sm text-muted self-center">
          {loading ? 'Loading...' : `${total} pending`}
        </span>
      </div>

      {/* Empty / loading states */}
      {loading && products.length === 0 && (
        <div className="text-center py-8 text-muted">Loading pending products...</div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-3 text-gray-300" size={32} />
          <p className="text-muted">No pending products to review</p>
        </div>
      )}

      {products.length > 0 && (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink">Submitted</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.imageUrls?.[0] && (
                            <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">{product.name}</p>
                          <p className="text-xs text-muted">{product.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">{product.vendor.businessName}</td>
                    <td className="px-4 py-3 text-sm text-muted">{product.category?.name || 'Uncategorized'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink">
                      {product.currentPrice ? formatCurrency(product.currentPrice) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(product.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-semibold"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => { setSelectedProduct(product.id); setShowRejectModal(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-muted">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-ink mb-4">Reject Product</h3>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explain why this product doesn't meet our standards (vendor will see this)"
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); setSelectedProduct(null); }}
                className="flex-1 px-4 py-2 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
