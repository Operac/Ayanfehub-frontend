import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';

const UNITS = ['kg', 'piece', 'dozen', 'bag (25kg)', 'bag (50kg)', 'crate', 'carton', 'liter'];
const CATEGORIES = ['Fresh Produce', 'Grains & Cereals', 'Dairy', 'Meat & Poultry', 'Beverages', 'Other'];

export default function VendorProductUpload() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'kg',
    categoryId: '',
    priceNgn: '',
    stockQuantity: '',
    imageUrls: [] as string[]
  });

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priceNgn' || name === 'stockQuantity' ? value : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImagePreview(base64);
        setFormData(prev => ({
          ...prev,
          imageUrls: [base64]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview('');
    setFormData(prev => ({
      ...prev,
      imageUrls: []
    }));
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
          ...formData,
          priceNgn: parseFloat(formData.priceNgn),
          stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload product');
      }

      showToast('Product submitted for approval! Admin will review within 24 hours.', 'success');
      setTimeout(() => navigate('/vendor-dashboard'), 1500);
    } catch (error) {
      showToast('Failed to upload product. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">Upload Product</h1>
          <p className="text-muted">Your product will be reviewed by our admin team before appearing to customers</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Product Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Fresh Tomatoes"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your product quality, origin, etc. (max 500 characters)"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted mt-1">
              {formData.description.length}/500
            </p>
          </div>

          {/* Unit & Category */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Unit *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Price (NGN) *</label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-muted text-sm font-semibold">₦</span>
                <input
                  type="number"
                  name="priceNgn"
                  value={formData.priceNgn}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  required
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
              <p className="text-xs text-muted mt-1">Leave blank for unlimited stock</p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-3">Product Image</label>
            {imagePreview ? (
              <div className="relative w-48 h-48 mb-4">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors">
                <Upload className="mx-auto mb-2 text-muted" size={24} />
                <p className="text-sm font-semibold text-ink">Click to upload image</p>
                <p className="text-xs text-muted mt-1">PNG, JPG up to 5MB</p>
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/png,image/jpeg"
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>How it works:</strong> After submission, your product will be reviewed by our team. You'll receive a notification once it's approved or if any changes are needed.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/vendor-dashboard')}
              className="flex-1 px-4 py-3 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
