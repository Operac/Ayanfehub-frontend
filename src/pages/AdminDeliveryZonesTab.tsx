import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';
import { Plus, Pencil, X, Check, ToggleLeft, ToggleRight, MapPin } from 'lucide-react';
import nigerianStates from '../data/nigerianStates';
import { ChevronDown } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  cities: string[];
  isActive: boolean;
  deliveryFeeNgn: number | string;
  consolidatedDeliveryFeeNgn: number | string;
}

const EMPTY_FORM = {
  name: '', cities: [] as string[], deliveryFeeNgn: '', consolidatedDeliveryFeeNgn: '', isActive: true
};

export default function AdminDeliveryZonesTab() {
  const { showToast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  // LGA picker state
  const [pickerState, setPickerState] = useState('');
  const [pickerLga, setPickerLga] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/admin/zones', { withCredentials: true });
      setZones(data);
    } catch { showToast('Failed to load zones', 'error'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPickerState('');
    setPickerLga('');
    setShowForm(true);
  };

  const openEdit = (z: Zone) => {
    setForm({
      name: z.name,
      cities: z.cities,
      deliveryFeeNgn: String(z.deliveryFeeNgn),
      consolidatedDeliveryFeeNgn: String(z.consolidatedDeliveryFeeNgn),
      isActive: z.isActive
    });
    setPickerState('');
    setPickerLga('');
    setEditingId(z.id);
    setShowForm(true);
  };

  const addLgaToZone = () => {
    if (!pickerLga) return;
    const normalised = pickerLga.toLowerCase();
    if (form.cities.map(c => c.toLowerCase()).includes(normalised)) {
      showToast('Already added', 'error'); return;
    }
    setForm(p => ({ ...p, cities: [...p.cities, pickerLga] }));
    setPickerLga('');
  };

  const removeLga = (lga: string) => {
    setForm(p => ({ ...p, cities: p.cities.filter(c => c !== lga) }));
  };

  const pickerLgas = nigerianStates.find(s => s.name === pickerState)?.lgas ?? [];

  const save = async () => {
    if (!form.name || !form.deliveryFeeNgn || !form.consolidatedDeliveryFeeNgn) {
      showToast('Fill in name and fees', 'error'); return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      cities: form.cities,
      deliveryFeeNgn: parseFloat(form.deliveryFeeNgn),
      consolidatedDeliveryFeeNgn: parseFloat(form.consolidatedDeliveryFeeNgn),
      isActive: form.isActive
    };
    try {
      if (editingId) {
        const { data } = await axios.patch(`/admin/zones/${editingId}`, payload, { withCredentials: true });
        setZones(prev => prev.map(z => z.id === editingId ? data : z));
      } else {
        const { data } = await axios.post('/admin/zones', payload, { withCredentials: true });
        setZones(prev => [...prev, data]);
      }
      showToast(editingId ? 'Zone updated' : 'Zone created', 'success');
      setShowForm(false);
    } catch (e) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.message : undefined;
      showToast(msg || 'Failed to save zone', 'error');
    } finally { setSaving(false); }
  };

  const toggleActive = async (zone: Zone) => {
    try {
      const { data } = await axios.patch(`/admin/zones/${zone.id}`, { isActive: !zone.isActive }, { withCredentials: true });
      setZones(prev => prev.map(z => z.id === zone.id ? data : z));
    } catch { showToast('Failed to update zone', 'error'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Delivery Zones</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage zones and the cities that map to them</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark">
          <Plus size={15} /> Add Zone
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>}

      <div className="space-y-3">
        {zones.map(zone => (
          <div key={zone.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{zone.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${zone.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
                  <span>Single: <strong className="text-gray-800">{formatCurrency(Number(zone.deliveryFeeNgn))}</strong></span>
                  <span>Consolidated: <strong className="text-gray-800">{formatCurrency(Number(zone.consolidatedDeliveryFeeNgn))}</strong></span>
                </div>
                {zone.cities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {zone.cities.map(c => (
                      <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{c}</span>
                    ))}
                  </div>
                )}
                {zone.cities.length === 0 && (
                  <p className="text-xs text-amber-600">No cities mapped — customers won't auto-match to this zone</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(zone)} className="text-gray-400 hover:text-gray-700">
                  {zone.isActive ? <ToggleRight size={22} className="text-primary" /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => openEdit(zone)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Pencil size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && zones.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No zones yet</p>}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">{editingId ? 'Edit Zone' : 'New Delivery Zone'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Zone Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Lekki / Victoria Island"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              {/* LGA picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <MapPin size={13} className="text-primary" /> LGAs mapped to this zone
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Customers who select any of these LGAs will be auto-matched to this zone.
                </p>

                {/* Added LGAs */}
                {form.cities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {form.cities.map(lga => (
                      <span key={lga} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        {lga}
                        <button onClick={() => removeLga(lga)} className="ml-0.5 hover:text-red-500">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* State selector */}
                <div className="relative mb-2">
                  <select
                    value={pickerState}
                    onChange={e => { setPickerState(e.target.value); setPickerLga(''); }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
                  >
                    <option value="">Select state…</option>
                    {nigerianStates.map(s => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>

                {/* LGA selector + Add button */}
                {pickerState && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={pickerLga}
                        onChange={e => setPickerLga(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
                      >
                        <option value="">Select LGA…</option>
                        {pickerLgas.map(lga => (
                          <option key={lga} value={lga}>{lga}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={addLgaToZone}
                      disabled={!pickerLga}
                      className="px-3 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-40 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Single Market Fee (₦) *</label>
                  <input type="number" value={form.deliveryFeeNgn} onChange={e => setForm(p => ({ ...p, deliveryFeeNgn: e.target.value }))}
                    placeholder="2000"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Consolidated Fee (₦) *</label>
                  <input type="number" value={form.consolidatedDeliveryFeeNgn} onChange={e => setForm(p => ({ ...p, consolidatedDeliveryFeeNgn: e.target.value }))}
                    placeholder="2500"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm font-semibold text-gray-700">Active (visible to customers)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={save} disabled={saving} className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 text-sm flex items-center justify-center gap-1.5">
                <Check size={14} /> {saving ? 'Saving…' : 'Save Zone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
