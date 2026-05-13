import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const ARTISAN_CATEGORIES = [
  'Tailoring', 'Electrical', 'Plumbing', 'Carpentry', 'Painting',
  'Catering', 'Photography', 'Beauty & Makeup', 'Auto Mechanic', 'Other'
];

export default function AdminArtisanCreate() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [linkUser, setLinkUser] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    phone: '',
    email: '',
    bio: '',
    password: '',
    linkExistingUserId: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.phone || !formData.email) {
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
        name: formData.name,
        category: formData.category,
        phone: formData.phone,
        email: formData.email,
        bio: formData.bio || undefined
      };
      if (linkUser) {
        payload.linkExistingUserId = formData.linkExistingUserId;
      } else {
        payload.password = formData.password;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/artisans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create artisan');
      }

      showToast('Artisan created successfully', 'success');
      setTimeout(() => navigate('/admin'), 1500);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create artisan', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">Create Artisan</h1>
          <p className="text-muted">Add a new artisan to your platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Artisan Details</h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Full Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              placeholder="e.g., Amaka Tailoring" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Select category</option>
              {ARTISAN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={2}
              placeholder="Brief description of skills and experience"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <h2 className="text-lg font-bold text-ink mb-4 mt-6">Contact Details</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Phone *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="+234..." required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="artisan@example.com" required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-ink mb-4 mt-6">Account Setup</h2>
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={!linkUser} onChange={() => setLinkUser(false)} className="w-4 h-4" />
              <span className="text-sm font-semibold text-ink">Create new user account</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={linkUser} onChange={() => setLinkUser(true)} className="w-4 h-4" />
              <span className="text-sm font-semibold text-ink">Link existing user</span>
            </label>
          </div>

          {linkUser ? (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-ink mb-2">User ID</label>
              <input type="text" name="linkExistingUserId" value={formData.linkExistingUserId} onChange={handleChange}
                placeholder="Enter user UUID"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-ink mb-2">Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => navigate('/admin')}
              className="flex-1 px-4 py-3 border border-gray-200 text-ink font-semibold rounded-xl hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Artisan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
