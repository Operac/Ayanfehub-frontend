import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2, Star, Camera } from 'lucide-react';

interface Address {
  id: string;
  label: string | null;
  landmarkDescription: string | null;
  isDefault: boolean;
  deliveryZone?: { id: string; name: string } | null;
}

interface ProfileData {
  fullName: string | null;
  email: string | null;
  phone: string;
  avatarUrl: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData>({ fullName: '', email: '', phone: '', avatarUrl: null });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [newAddress, setNewAddress] = useState({ label: '', landmarkDescription: '', isDefault: false });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    const load = async () => {
      try {
        const [profileRes, addrRes] = await Promise.all([
          axios.get('/auth/profile'),
          axios.get('/auth/addresses'),
        ]);
        const p = profileRes.data;
        setProfile({ fullName: p.fullName || '', email: p.email || '', phone: p.phone || '', avatarUrl: p.avatarUrl });
        setAddresses(addrRes.data);
      } catch {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast('Image must be under 5MB', 'warning');

    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const { data } = await axios.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(p => ({ ...p, avatarUrl: data.avatarUrl }));
      showToast('Avatar updated', 'success');
    } catch {
      showToast('Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.patch('/auth/profile', { fullName: profile.fullName });
      showToast('Profile updated', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.landmarkDescription) return showToast('Please enter a landmark description', 'warning');
    setAddingAddress(true);
    try {
      const { data } = await axios.post('/auth/addresses', newAddress);
      setAddresses(prev => newAddress.isDefault
        ? [data, ...prev.map(a => ({ ...a, isDefault: false }))]
        : [...prev, data]);
      setNewAddress({ label: '', landmarkDescription: '', isDefault: false });
      setShowAddForm(false);
      showToast('Address added', 'success');
    } catch {
      showToast('Failed to add address', 'error');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await axios.delete(`/auth/addresses/${id}`);
      setAddresses(prev => prev.filter(a => a.id !== id));
      showToast('Address removed', 'success');
    } catch {
      showToast('Failed to remove address', 'error');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await axios.patch(`/auth/addresses/${id}`, { isDefault: true });
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
      showToast('Default address updated', 'success');
    } catch {
      showToast('Failed to update default address', 'error');
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  const initials = profile.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

      {/* Avatar & Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} className="size-16 rounded-full object-cover" alt="avatar" />
                : initials}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 size-6 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-50"
              title="Change avatar"
            >
              <Camera size={11} />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{profile.fullName || 'No name set'}</p>
            <p className="text-sm text-gray-500">{profile.email || profile.phone}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
            <input
              type="text"
              value={profile.fullName || ''}
              onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={profile.email || ''}
              disabled
              className="w-full p-3 bg-gray-100 rounded-xl border border-gray-200 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              disabled
              className="w-full p-3 bg-gray-100 rounded-xl border border-gray-200 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Delivery Addresses */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={18} className="text-primary" /> Delivery Addresses
          </h2>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            <Plus size={16} /> Add New
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Label (e.g. Home, Office)</label>
              <input
                type="text"
                value={newAddress.label}
                onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))}
                className="w-full p-3 bg-white rounded-xl border border-gray-200 text-sm"
                placeholder="Home"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Landmark / Description</label>
              <textarea
                value={newAddress.landmarkDescription}
                onChange={e => setNewAddress(p => ({ ...p, landmarkDescription: e.target.value }))}
                className="w-full p-3 bg-white rounded-xl border border-gray-200 text-sm min-h-[80px]"
                placeholder="Near Shoprite, 15 Allen Avenue, Ikeja..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newAddress.isDefault}
                onChange={e => setNewAddress(p => ({ ...p, isDefault: e.target.checked }))}
                className="rounded"
              />
              Set as default address
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleAddAddress}
                disabled={addingAddress}
                className="flex-1 bg-black text-white py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50"
              >
                {addingAddress ? 'Adding…' : 'Add Address'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {addresses.length === 0 && !showAddForm ? (
          <p className="text-sm text-gray-400 text-center py-4">No addresses saved yet.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className={`p-4 rounded-xl border ${addr.isDefault ? 'border-primary bg-primary/5' : 'border-gray-100'} flex items-start justify-between gap-3`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{addr.label || 'Address'}</p>
                    {addr.isDefault && (
                      <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">DEFAULT</span>
                    )}
                    {addr.deliveryZone && (
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{addr.deliveryZone.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{addr.landmarkDescription || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      title="Set as default"
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      <Star size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
