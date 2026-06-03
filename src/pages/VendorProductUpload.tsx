import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const UNITS = ['kg', 'piece', 'dozen', 'bag (25kg)', 'bag (50kg)', 'crate', 'carton', 'liter'];

interface Category { id: string; name: string; slug: string }

export default function VendorProductUpload() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'kg',
    categoryId: '',
    priceNgn: '',
    stockQuantity: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/marketplace/categories`)
      .then(r => r.json())
      .then(setCategories)
      .catch(() => setCategoryError(true));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.unit || !formData.priceNgn) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vendors/me/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          unit: formData.unit,
          categoryId: formData.categoryId || undefined,
          priceNgn: parseFloat(formData.priceNgn),
          stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined,
          imageUrls: formData.imageUrl ? [formData.imageUrl] : []
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to upload product');
      }

      showToast('Product submitted for approval! Admin will review within 24 hours.', 'success');
      setTimeout(() => navigate('/vendor'), 1500);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to upload product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">Upload Product</h1>
          <p className="text-muted">Your product will be reviewed by our admin team before appearing to customers</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Fresh Tomatoes"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your product quality, origin, etc."
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted mt-1">{formData.description.length}/500</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Unit *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={categoryError}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
              >
                {categoryError
                  ? <option>Failed to load categories</option>
                  : <>
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </>
                }
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Price (₦) *</label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-muted text-sm font-semibold">₦</span>
                <input
                  type="number"
                  name="priceNgn"
                  value={formData.priceNgn}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Stock Quantity</label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                placeholder="Leave blank for unlimited"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">Product Image URL</label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1.5 text-xs text-muted">Paste a public image link (e.g. from Cloudinary, Imgur, or your website). The image must be publicly accessible.</p>
            {formData.imageUrl && (
              <div className="mt-3 w-32 h-32 rounded-xl overflow-hidden border border-gray-100">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <p className="text-xs text-muted mt-1">Paste a public image URL (Imgur, Google Drive public link, etc.)</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>How it works:</strong> After submission, your product will be reviewed by our team within 24 hours. It will only appear to customers once approved.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/vendor')}
              className="flex-1 px-4 py-3 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all"
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
