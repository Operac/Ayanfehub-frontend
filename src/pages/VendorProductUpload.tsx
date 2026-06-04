import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Loader2, ImageOff } from 'lucide-react';
import axios from 'axios';

const UNITS = ['kg', 'piece', 'dozen', 'bag (25kg)', 'bag (50kg)', 'crate', 'carton', 'liter'];

interface Category { id: string; name: string; slug: string }

export default function VendorProductUpload() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'kg',
    categoryId: '',
    priceNgn: '',
    stockQuantity: '',
    imageUrl: '',
  });

  useEffect(() => {
    setCategoryLoading(true);
    axios.get('/markets/categories')
      .then(r => setCategories(r.data))
      .catch(() => setCategoryError(true))
      .finally(() => setCategoryLoading(false));
  }, []);

  // Reset broken-image flag whenever URL changes
  useEffect(() => {
    setImgBroken(false);
  }, [formData.imageUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.unit || !formData.priceNgn) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const price = parseFloat(formData.priceNgn);
    if (isNaN(price) || price <= 0) {
      showToast('Please enter a valid price greater than ₦0', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/vendors/me/products', {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        unit: formData.unit,
        categoryId: formData.categoryId || undefined,
        priceNgn: price,
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined,
        imageUrls: formData.imageUrl ? [formData.imageUrl] : [],
      }, { withCredentials: true });

      showToast('Product submitted for approval! Admin will review within 24 hours.', 'success');
      setTimeout(() => navigate('/vendor'), 1500);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Failed to upload product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">Upload Product</h1>
          <p className="text-muted">Your product will be reviewed by our admin team before appearing to customers</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {/* Product Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
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

          {/* Description */}
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

          {/* Unit + Category */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="unit" className="block text-sm font-semibold text-ink mb-2">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="categoryId" className="block text-sm font-semibold text-ink mb-2">Category</label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={categoryLoading || categoryError}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
              >
                {categoryLoading
                  ? <option>Loading…</option>
                  : categoryError
                    ? <option>Failed to load</option>
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

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Price (₦) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-muted text-sm font-semibold">₦</span>
                <input
                  type="number"
                  name="priceNgn"
                  value={formData.priceNgn}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
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
                min="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Image URL */}
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
            <p className="mt-1.5 text-xs text-muted">
              Paste a public image link (e.g. from Cloudinary, Imgur, or your website). The image must be publicly accessible.
            </p>

            {/* Image preview */}
            {formData.imageUrl && (
              <div className="mt-3 w-32 h-32 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                {imgBroken ? (
                  <div className="flex flex-col items-center gap-1 text-gray-300">
                    <ImageOff size={24} />
                    <p className="text-[10px] text-gray-400">Invalid URL</p>
                  </div>
                ) : (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setImgBroken(true)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-ink/80">
              <strong>How it works:</strong> After submission, your product will be reviewed by our team within 24 hours. It will only appear to customers once approved.
            </p>
          </div>

          {/* Actions */}
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-all"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
