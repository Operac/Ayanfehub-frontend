import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

interface Market {
  id: string;
  name: string;
}

export default function AdminVendorCreate() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkUser, setLinkUser] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    marketId: '',
    contactName: '',
    phone: '',
    email: '',
    password: '',
    linkExistingUserId: ''
  });

  useEffect(() => {
    // Fetch markets
    fetch(`${import.meta.env.VITE_API_BASE_URL}/markets`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setMarkets(data))
      .catch(() => showToast('Failed to load markets', 'error'));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.businessName || !formData.marketId || !formData.contactName ||
        !formData.phone || !formData.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!linkUser && !formData.password) {
      showToast('Password is required for new user creation', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        businessName: formData.businessName,
        marketId: formData.marketId,
        contactName: formData.contactName,
        phone: formData.phone,
        email: formData.email
      };

      if (linkUser) {
        payload.linkExistingUserId = formData.linkExistingUserId;
      } else {
        payload.password = formData.password;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create vendor');
      }

      showToast('Vendor created successfully', 'success');
      setTimeout(() => navigate('/admin'), 1500);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create vendor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">Create Vendor</h1>
          <p className="text-muted">Add a new vendor to your marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Business Details */}
          <h2 className="text-lg font-bold text-ink mb-4">Business Details</h2>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">Business Name *</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="e.g., Fresh Farm Produce"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">Market *</label>
            <select
              name="marketId"
              value={formData.marketId}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select market</option>
              {markets.map(market => (
                <option key={market.id} value={market.id}>{market.name}</option>
              ))}
            </select>
          </div>

          {/* Contact Details */}
          <h2 className="text-lg font-bold text-ink mb-4 mt-8">Contact Details</h2>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-2">Contact Name *</label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Contact person's full name"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+234..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vendor@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* User Linking */}
          <h2 className="text-lg font-bold text-ink mb-4 mt-8">Account Setup</h2>

          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="userChoice"
                checked={!linkUser}
                onChange={() => setLinkUser(false)}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold text-ink">Create new user account</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="userChoice"
                checked={linkUser}
                onChange={() => setLinkUser(true)}
                className="w-4 h-4"
              />
              <span className="text-sm font-semibold text-ink">Link existing user</span>
            </label>
          </div>

          {linkUser ? (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink mb-2">User ID *</label>
              <input
                type="text"
                name="linkExistingUserId"
                value={formData.linkExistingUserId}
                onChange={handleChange}
                placeholder="Enter user UUID"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted mt-1">Search for user ID in the users list</p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-ink mb-2">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="flex-1 px-4 py-3 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
