import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';

interface Zone { id: string; name: string }
interface Market { id: string; name: string; category: string }
interface Rate { marketId: string; deliveryZoneId: string; priceNgn: number | string }

export default function AdminDeliveryRatesTab() {
  const { showToast } = useToast();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [rates, setRates] = useState<Record<string, Record<string, string>>>({}); // rates[marketId][zoneId] = price string
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/admin/markets', { withCredentials: true }),
      axios.get('/admin/zones', { withCredentials: true }),
      axios.get('/admin/delivery-rates', { withCredentials: true })
    ]).then(([mRes, zRes, rRes]) => {
      setMarkets(mRes.data);
      setZones(zRes.data);
      // Build rates map
      const map: Record<string, Record<string, string>> = {};
      mRes.data.forEach((m: Market) => { map[m.id] = {}; });
      rRes.data.forEach((r: Rate) => {
        if (!map[r.marketId]) map[r.marketId] = {};
        map[r.marketId][r.deliveryZoneId] = String(r.priceNgn);
      });
      setRates(map);
    }).catch(() => showToast('Failed to load delivery rates', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handlePriceChange = (marketId: string, zoneId: string, value: string) => {
    setRates(prev => ({
      ...prev,
      [marketId]: { ...prev[marketId], [zoneId]: value }
    }));
  };

  const saveMarketRates = async (marketId: string) => {
    setSaving(marketId);
    try {
      const marketRates = rates[marketId] || {};
      const payload = zones
        .filter(z => marketRates[z.id] !== undefined && marketRates[z.id] !== '')
        .map(z => ({
          marketId,
          deliveryZoneId: z.id,
          priceNgn: parseFloat(marketRates[z.id])
        }))
        .filter(r => !isNaN(r.priceNgn) && r.priceNgn >= 0);

      await axios.put('/admin/delivery-rates', { rates: payload }, { withCredentials: true });
      showToast('Delivery rates saved', 'success');
    } catch {
      showToast('Failed to save rates', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-sm text-gray-400 text-center py-8">Loading…</p>;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-900">Delivery Rates</h2>
        <p className="text-sm text-gray-400 mt-0.5">Set per-market delivery prices for each zone. Leave blank = "Contact for price".</p>
      </div>

      {zones.length === 0 && (
        <div className="text-center py-8 text-sm text-amber-600 bg-amber-50 rounded-xl">
          No delivery zones set up yet. Create zones in the Delivery Zones tab first.
        </div>
      )}

      <div className="space-y-3">
        {markets.map(market => {
          const isOpen = expanded === market.id;
          return (
            <div key={market.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : market.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold text-gray-900">{market.name}</p>
                  <p className="text-xs text-gray-400">{market.category}</p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {zones.length === 0 ? (
                    <p className="text-sm text-gray-400">No zones available</p>
                  ) : (
                    <>
                      <div className="space-y-3 mb-4">
                        {zones.map(zone => {
                          const val = rates[market.id]?.[zone.id] ?? '';
                          return (
                            <div key={zone.id} className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">{zone.name}</p>
                              </div>
                              <div className="relative w-40 flex-shrink-0">
                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-semibold">₦</span>
                                <input
                                  type="number"
                                  value={val}
                                  onChange={e => handlePriceChange(market.id, zone.id, e.target.value)}
                                  placeholder="Contact"
                                  className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div className="w-28 text-right flex-shrink-0">
                                {val && !isNaN(parseFloat(val)) ? (
                                  <span className="text-xs font-semibold text-gray-700">{formatCurrency(parseFloat(val))}</span>
                                ) : (
                                  <span className="text-xs text-amber-600">Contact for price</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => saveMarketRates(market.id)}
                          disabled={saving === market.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50"
                        >
                          <Save size={14} />
                          {saving === market.id ? 'Saving…' : 'Save Rates'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {markets.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No markets found</p>}
      </div>
    </div>
  );
}
