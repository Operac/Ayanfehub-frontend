import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';
import { Briefcase, Star, Calendar, ToggleLeft, ToggleRight, Edit2, Check, X } from 'lucide-react';

interface ArtisanService {
  id: string;
  serviceName: string;
  priceNgn: number;
  description: string | null;
  turnaroundDays: number | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { fullName: string | null };
}

interface ArtisanData {
  id: string;
  name: string;
  category: string;
  bio: string | null;
  phone: string | null;
  isAvailable: boolean;
  ratingAverage: string | null;
  verificationStatus: string;
  portfolioImages: string[];
  services: ArtisanService[];
  reviews: Review[];
}

interface Booking {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  specialInstructions: string | null;
  user: { fullName: string | null; avatarUrl: string | null };
}

type Tab = 'overview' | 'bookings' | 'edit';

const STATUS_COLORS: Record<string, string> = {
  PAYMENT_CONFIRMED: 'text-blue-700 bg-blue-50',
  SOURCING:          'text-amber-700 bg-amber-50',
  PENDING_PAYMENT:   'text-amber-700 bg-amber-50',
  DELIVERED:         'text-green-700 bg-green-50',
  CANCELLED:         'text-red-700 bg-red-50',
};

export default function ArtisanDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [artisan, setArtisan] = useState<ArtisanData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({ name: '', bio: '', phone: '', category: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get('/artisans/me')
      .then(r => {
        setArtisan(r.data);
        setEditForm({ name: r.data.name, bio: r.data.bio || '', phone: r.data.phone || '', category: r.data.category });
      })
      .catch(() => {
        showToast('No artisan profile linked to your account', 'error');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  useEffect(() => {
    if (tab === 'bookings' && bookings.length === 0) {
      axios.get('/artisans/me/bookings')
        .then(r => setBookings(r.data))
        .catch(() => showToast('Failed to load bookings', 'error'));
    }
  }, [tab]);

  const toggleAvailability = async () => {
    if (!artisan) return;
    try {
      const updated = await axios.put('/artisans/me', { isAvailable: !artisan.isAvailable });
      setArtisan(updated.data);
      showToast(`You are now ${!artisan.isAvailable ? 'available' : 'unavailable'}`, 'success');
    } catch {
      showToast('Failed to update availability', 'error');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await axios.put('/artisans/me', editForm);
      setArtisan(prev => prev ? { ...prev, ...updated.data } : null);
      showToast('Profile updated', 'success');
      setTab('overview');
    } catch {
      showToast('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-4">
      {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  if (!artisan) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{artisan.name}</h1>
          <p className="text-sm text-gray-500">{artisan.category}</p>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block',
            artisan.verificationStatus === 'VERIFIED'  ? 'bg-green-100 text-green-700' :
            artisan.verificationStatus === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          )}>{artisan.verificationStatus}</span>
        </div>
        <button
          onClick={toggleAvailability}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition',
            artisan.isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
          )}
        >
          {artisan.isAvailable ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {artisan.isAvailable ? 'Available' : 'Unavailable'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['overview', 'bookings', 'edit'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-5 py-2 rounded-lg text-sm font-medium capitalize transition',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <Star size={18} className="text-amber-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Rating</p>
              </div>
              <p className="text-2xl font-black text-gray-900">
                {artisan.ratingAverage ? `${parseFloat(String(artisan.ratingAverage)).toFixed(1)} ★` : 'No ratings'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase size={18} className="text-primary" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Services</p>
              </div>
              <p className="text-2xl font-black text-gray-900">{artisan.services.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={18} className="text-blue-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Reviews</p>
              </div>
              <p className="text-2xl font-black text-gray-900">{artisan.reviews.length}</p>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">My Services</h3>
            {artisan.services.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No services listed. Contact admin to add services.</p>
            ) : (
              <div className="space-y-3">
                {artisan.services.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{s.serviceName}</p>
                      {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                      {s.turnaroundDays && <p className="text-xs text-gray-400">{s.turnaroundDays} day turnaround</p>}
                    </div>
                    <span className="font-bold text-primary text-sm">{formatCurrency(Number(s.priceNgn))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          {artisan.reviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Recent Reviews</h3>
              <div className="space-y-3">
                {artisan.reviews.slice(0, 5).map(r => (
                  <div key={r.id} className="border-b border-gray-50 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{r.user.fullName || 'Customer'}</p>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={cn('text-xs', s <= r.rating ? 'text-amber-400' : 'text-gray-200')}>★</span>
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-xs text-gray-500 leading-relaxed">{r.comment}</p>}
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {tab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              <p>No bookings yet</p>
            </div>
          ) : (
            bookings.map(b => {
              let details: Record<string, unknown> = {};
              try { details = JSON.parse(b.specialInstructions || '{}'); } catch {}
              return (
                <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {b.user.fullName?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{b.user.fullName || 'Customer'}</p>
                        <p className="text-xs text-gray-400 font-mono">{b.orderNumber}</p>
                        {details.serviceName && <p className="text-xs text-gray-500 mt-0.5">{String(details.serviceName)}</p>}
                        {details.date && <p className="text-xs text-gray-400">{new Date(String(details.date)).toLocaleDateString()}</p>}
                        {details.address && <p className="text-xs text-gray-400">{String(details.address)}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', STATUS_COLORS[b.status] ?? 'bg-gray-50 text-gray-600')}>
                        {b.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(b.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit Profile Tab */}
      {tab === 'edit' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 max-w-lg">
          <h3 className="font-bold text-gray-900 mb-2">Edit Profile</h3>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Display Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Category / Trade</label>
            <input
              type="text"
              value={editForm.category}
              onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
              placeholder="e.g. Plumber, Electrician, Tailor"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Bio</label>
            <textarea
              value={editForm.bio}
              onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm min-h-[100px]"
              placeholder="Describe your skills and experience..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50"
            >
              <Check size={15} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={() => setTab('overview')}
              className="flex items-center gap-2 border border-gray-200 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition"
            >
              <X size={15} /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
