import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

interface Vendor { id: string; businessName: string; market: { name: string } }

const UNITS = ['kg', 'piece', 'dozen', 'bag (25kg)', 'bag (50kg)', 'crate', 'carton', 'liter'];

export default function AdminProductCreate() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: '',
    name: '',
    description: '',
    unit: 'kg',
    priceNgn: '',
    stockQuantity: '',
    approvalStatus: 'APPROVED'
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setVendors(data))
      .catch(() => showToast('Failed to load vendors', 'error'));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId || !formData.name || !formData.unit || !formData.priceNgn) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors/${formData.vendorId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          unit: formData.unit,
          priceNgn: parseFloat(formData.priceNgn),
          stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined,
          approvalStatus: formData.approvalStatus
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create product');
      }

      showToast('Product created successfully', 'success');
      setTimeout(() => navigate('/admin'), 1500);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">Create Product</h1>
          <p className="text-muted">Add a product for a vendor</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Vendor *</label>
            <select name="vendorId" value={formData.vendorId} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select vendor</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.businessName} ({v.market?.name})</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Product Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              placeholder="e.g., Fresh Tomatoes" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={2}
              placeholder="Product description"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Unit *</label>
              <select name="unit" value={formData.unit} onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Price (₦) *</label>
              <input type="number" name="priceNgn" value={formData.priceNgn} onChange={handleChange}
                placeholder="0.00" step="0.01" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Stock Quantity</label>
            <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange}
              placeholder="Leave blank for unlimited"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">Approval Status</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="approvalStatus" value="APPROVED"
                  checked={formData.approvalStatus === 'APPROVED'}
                  onChange={handleChange} className="w-4 h-4" />
                <span className="text-sm font-semibold text-emerald-700">
                  ✓ Approved — product goes live immediately
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="approvalStatus" value="PENDING_APPROVAL"
                  checked={formData.approvalStatus === 'PENDING_APPROVAL'}
                  onChange={handleChange} className="w-4 h-4" />
                <span className="text-sm font-semibold text-amber-700">
                  ⏳ Pending — requires separate review
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/admin')}
              className="flex-1 px-4 py-3 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
