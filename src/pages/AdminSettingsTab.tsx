import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Phone, Save } from 'lucide-react';

export default function AdminSettingsTab() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    contact_phone: '',
    consolidation_day_of_week: '4'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/admin/settings', { withCredentials: true })
      .then(r => setSettings(prev => ({ ...prev, ...r.data })))
      .catch(() => showToast('Failed to load settings', 'error'));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch('/admin/settings', settings, { withCredentials: true });
      showToast('Settings saved', 'success');
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
          <Phone size={16} className="text-primary" /> Contact & Support
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Contact Phone Number
          </label>
          <input
            type="tel"
            value={settings.contact_phone}
            onChange={e => setSettings(p => ({ ...p, contact_phone: e.target.value }))}
            placeholder="+2348012345678"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Shown to customers when their zone is not served or delivery rate is not set.
          </p>
        </div>

        <div className="mb-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Consolidated Delivery Day
          </label>
          <select
            value={settings.consolidation_day_of_week}
            onChange={e => setSettings(p => ({ ...p, consolidation_day_of_week: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {DAYS.map((d, i) => (
              <option key={i} value={String(i)}>{d}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            When a customer orders from multiple markets, all items are consolidated and delivered on this day.
          </p>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 text-sm"
      >
        <Save size={15} />
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}
