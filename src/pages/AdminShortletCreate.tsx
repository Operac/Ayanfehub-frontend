import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const COMMON_AMENITIES = [
  'WiFi', 'AC', 'Generator', 'Parking', 'Swimming Pool',
  'Security', 'Kitchen', 'Laundry', 'CCTV', 'Smart TV'
];

export default function AdminShortletCreate() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [linkUser, setLinkUser] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ratePerNight: '',
    email: '',
    password: '',
    linkExistingUserId: ''
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.ratePerNight) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (!linkUser && !formData.email) {
      showToast('Email is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        location: formData.location,
        ratePerNight: parseFloat(formData.ratePerNight),
        amenities: selectedAmenities,
        email: formData.email
      };
      if (linkUser) {
        payload.linkExistingUserId = formData.linkExistingUserId;
      } else {
        payload.password = formData.password;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/shortlets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create shortlet');
      }

      showToast('Shortlet created successfully', 'success');
      setTimeout(() => navigate('/admin'), 1500);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create shortlet', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-ink mb-2">Create Shortlet</h1>
          <p className="text-muted">Add a new short-let apartment to the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-ink mb-4">Property Details</h2>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Property Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange}
              placeholder="e.g., Luxury 2-Bed Apartment Lekki" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Location *</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange}
              placeholder="e.g., Lekki Phase 1, Lagos" required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Rate per Night (₦) *</label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-muted font-semibold text-sm">₦</span>
              <input type="number" name="ratePerNight" value={formData.ratePerNight} onChange={handleChange}
                placeholder="0.00" step="0.01" required
                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-ink mb-3">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selectedAmenities.includes(a)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-ink border-gray-200 hover:border-primary'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            {selectedAmenities.length > 0 && (
              <p className="text-xs text-muted mt-2">Selected: {selectedAmenities.join(', ')}</p>
            )}
          </div>

          <h2 className="text-lg font-bold text-ink mb-4">Account Setup (Manager)</h2>
          <div className="space-y-3 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={!linkUser} onChange={() => setLinkUser(false)} className="w-4 h-4" />
              <span className="text-sm font-semibold text-ink">Create new manager account</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={linkUser} onChange={() => setLinkUser(true)} className="w-4 h-4" />
              <span className="text-sm font-semibold text-ink">Link existing user</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-ink mb-2">Manager Email {!linkUser && '*'}</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="manager@example.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
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
              <label className="block text-sm font-semibold text-ink mb-2">Password</label>
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
              {loading ? 'Creating...' : 'Create Shortlet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
