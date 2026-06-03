import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';
import { Trash2, ArrowRight, AlertTriangle, MapPin, Tag, X, Check, ShoppingCart, Lock, Phone, Loader2, Clock, RefreshCw, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import StateCitySelect from '../components/StateCitySelect';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import type { FlutterWaveResponse } from 'flutterwave-react-v3/dist/types';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

interface Address {
  id: string;
  label: string | null;
  landmarkDescription: string | null;
  isDefault: boolean;
  city?: string | null;
}

type ZoneLookupResult =
  | { found: true; zone: { id: string; name: string }; isConsolidated?: boolean }
  | { found: false; contactPhone: string };

type DeliveryFeeResult =
  | { contactPrice: false; fee: number; isConsolidated: boolean }
  | { contactPrice: true; contactPhone: string };

interface MarketCutoff {
  marketId: string;
  marketName: string;
  hasSchedule: boolean;
  isOpen: boolean;
  isApproaching: boolean;
  minutesUntilCutoff: number;
  cutoffTime: string;
  nextDeliveryDate: string | null;
  dayName: string;
}

interface PriceChange {
  productId: string;
  name: string;
  oldPrice: number;
  newPrice: number;
}

const SERVICE_FEE_RATE = 0.05;

const selectClass = 'w-full p-3.5 bg-surface border border-gray-200 rounded-2xl text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

interface FlwConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: { email: string; name: string };
  customizations: { title: string; description: string };
  meta?: Record<string, string>;
}

function FlutterwaveModal({ config, onSuccess, onClose }: {
  config: FlwConfig;
  onSuccess: (ref: string) => void;
  onClose: () => void;
}) {
  // flutterwave-react-v3 lacks TypeScript declarations; cast is unavoidable here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePayment = useFlutterwave(config as any);

  useEffect(() => {
    handlePayment({
      callback: (response: FlutterWaveResponse) => {
        closePaymentModal();
        if (response.status === 'successful') {
          onSuccess(String(response.transaction_id));
        } else {
          onClose();
        }
      },
      onClose,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function CartPage() {
  const { cart, removeFromCart, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLga, setSelectedLga] = useState('');
  const [zoneLookup, setZoneLookup] = useState<ZoneLookupResult | null>(null);
  const [isLookingUpZone, setIsLookingUpZone] = useState(false);
  const [deliveryFeeResult, setDeliveryFeeResult] = useState<DeliveryFeeResult | null>(null);
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [flwConfig, setFlwConfig] = useState<FlwConfig | null>(null);

  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountNgn: number; description?: string } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Inline add-address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ label: '', landmarkDescription: '', isDefault: true });
  const [addingAddress, setAddingAddress] = useState(false);

  // Cutoff countdowns
  const [marketCutoffs, setMarketCutoffs] = useState<MarketCutoff[]>([]);
  const [, setCountdownTick] = useState(0); // forces re-render every minute

  // Price-change modal
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);

  const uniqueMarketIds = [...new Set(cart.map(i => i.market_id))];
  const isMultiMarket = uniqueMarketIds.length > 1;

  // Staleness: oldest item in cart
  const oldestAddedAt = cart.reduce<string | null>((oldest, item) => {
    if (!item.addedAt) return oldest;
    return !oldest || item.addedAt < oldest ? item.addedAt : oldest;
  }, null);
  const cartAgeHours = oldestAddedAt
    ? (Date.now() - new Date(oldestAddedAt).getTime()) / 3_600_000
    : 0;

  const serviceFee = Math.round(total * SERVICE_FEE_RATE);
  const deliveryFee = deliveryFeeResult && !deliveryFeeResult.contactPrice ? deliveryFeeResult.fee : 0;
  const discount = promoApplied?.discountNgn ?? 0;
  const grandTotal = total + serviceFee + deliveryFee - discount;
  const contactPhone = (zoneLookup && !zoneLookup.found ? zoneLookup.contactPhone : null)
    ?? (deliveryFeeResult?.contactPrice ? deliveryFeeResult.contactPhone : null);

  useEffect(() => {
    if (user) {
      axios.get('/auth/addresses').then(r => {
        setAddresses(r.data);
        const def = r.data.find((a: Address) => a.isDefault);
        if (def) setSelectedAddressId(def.id);
      }).catch(() => {});
    }
  }, [user]);

  // Fetch cutoff info whenever cart markets change
  useEffect(() => {
    if (uniqueMarketIds.length === 0) return;
    axios.post('/checkout/market-cutoffs', { marketIds: uniqueMarketIds })
      .then(r => setMarketCutoffs(r.data))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  // Tick every 60s so countdown display stays live
  useEffect(() => {
    const timer = setInterval(() => setCountdownTick(t => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const fetchDeliveryFee = async (zoneId: string) => {
    setIsLoadingFee(true);
    try {
      const { data } = await axios.post('/checkout/delivery-fee', { zoneId, marketIds: uniqueMarketIds });
      setDeliveryFeeResult(data);
    } catch {
      setDeliveryFeeResult(null);
    } finally {
      setIsLoadingFee(false);
    }
  };

  const handleLocationSelect = async (state: string, lga: string) => {
    setSelectedState(state);
    setSelectedLga(lga);
    setZoneLookup(null);
    setDeliveryFeeResult(null);
    setSelectedZoneId('');
    setIsLookingUpZone(true);
    try {
      const { data } = await axios.post('/checkout/lookup-zone', { city: lga });
      setZoneLookup(data);
      if (data.found) {
        setSelectedZoneId(data.zone.id);
        fetchDeliveryFee(data.zone.id);
      }
    } catch {
      setZoneLookup(null);
    } finally {
      setIsLookingUpZone(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    try {
      const { data } = await axios.post('/checkout/apply-code', { code: promoInput.trim(), subtotalNgn: total });
      setPromoApplied({ code: data.code, discountNgn: data.discountNgn, description: data.description });
      showToast(`Promo applied! You saved ${formatCurrency(data.discountNgn)}`, 'success');
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Invalid promo code', 'error');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddr.landmarkDescription.trim()) return showToast('Please enter a landmark/description', 'warning');
    setAddingAddress(true);
    try {
      const { data } = await axios.post('/auth/addresses', newAddr);
      setAddresses(prev => newAddr.isDefault
        ? [data, ...prev.map(a => ({ ...a, isDefault: false }))]
        : [...prev, data]);
      setSelectedAddressId(data.id);
      setNewAddr({ label: '', landmarkDescription: '', isDefault: true });
      setShowAddressForm(false);
      showToast('Address saved', 'success');
    } catch {
      showToast('Failed to add address', 'error');
    } finally {
      setAddingAddress(false);
    }
  };

  const doInitiatePayment = useCallback(async (acknowledgePriceChange = false) => {
    setIsCheckingOut(true);
    const payload = {
      items: cart.map(i => ({ id: i.id, quantity: i.quantity, clientPrice: i.price })),
      deliveryAddressId: selectedAddressId,
      deliveryZoneId: selectedZoneId,
      promoCode: promoApplied?.code,
      acknowledgePriceChange,
    };
    try {
      const { data } = await axios.post('/checkout/initiate-payment', payload);
      setPriceChanges([]);
      setFlwConfig({
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
        tx_ref: data.paymentReference,
        amount: data.order.total,
        currency: 'NGN',
        payment_options: 'card,ussd,banktransfer',
        customer: data.flutterwavePayload?.customer ?? { email: user!.email ?? '', name: 'Customer' },
        customizations: { title: 'Ayanfe Hub Checkout', description: `Order ${data.order.orderNumber}` },
        meta: { orderId: data.order.id },
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409 && err.response.data?.code === 'PRICE_CHANGED') {
        // Show price-change confirmation modal
        setPriceChanges(err.response.data.changes);
        setIsCheckingOut(false);
        return;
      }
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Checkout failed. Please try again.', 'error');
      setIsCheckingOut(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, selectedAddressId, selectedZoneId, promoApplied, user]);

  const handleCheckout = () => {
    if (!user) return navigate('/login');
    if (!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY) {
      showToast('Payment is currently unavailable. Please try again later.', 'error');
      return;
    }
    if (!selectedAddressId) return showToast('Please select a delivery address', 'warning');
    if (!selectedZoneId) return showToast('Please enter your location to detect your delivery zone', 'warning');
    if (deliveryFeeResult?.contactPrice) return showToast('Please contact us to arrange delivery pricing for your area', 'warning');
    doInitiatePayment(false);
  };

  const handleConfirmPriceChange = () => doInitiatePayment(true);

  const onPaymentSuccess = (transactionId: string) => {
    showToast('Payment successful! Your order is confirmed.', 'success');
    clearCart();
    navigate('/orders');
    console.info('Flutterwave transaction ID:', transactionId);
  };

  const onPaymentClose = () => {
    setFlwConfig(null);
    setIsCheckingOut(false);
    showToast('Payment cancelled.', 'info');
  };

  if (cart.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
      >
        <div className="size-20 rounded-3xl bg-surface flex items-center justify-center mb-5">
          <ShoppingCart size={36} className="text-muted" />
        </div>
        <h2 className="text-2xl font-black text-ink mb-2">Your cart is empty</h2>
        <p className="text-muted mb-8 text-sm">Start shopping from our local markets.</p>
        <Link
          to="/marketplace"
          className="px-8 py-3.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors"
        >
          Browse Markets
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {flwConfig && (
        <FlutterwaveModal config={flwConfig} onSuccess={onPaymentSuccess} onClose={onPaymentClose} />
      )}

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-black text-ink tracking-tight mb-8"
      >
        Shopping Cart
      </motion.h1>

      {/* ── Staleness warning ── */}
      <AnimatePresence>
        {cartAgeHours >= 12 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex gap-3 rounded-2xl p-4 mb-4 text-sm border ${
              cartAgeHours >= 24
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <Clock className="shrink-0 mt-0.5" size={17} />
            <div>
              <p className="font-bold">
                {cartAgeHours >= 24 ? 'Cart items may be outdated' : 'Cart items added over 12 hours ago'}
              </p>
              <p className="mt-0.5 opacity-80">
                Market prices change daily. Prices will be re-validated at checkout — if anything changed you'll be shown the difference before paying.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cutoff countdowns ── */}
      <AnimatePresence>
        {marketCutoffs.filter(m => m.hasSchedule && m.minutesUntilCutoff <= 120).map(m => {
          const hrs = Math.floor(m.minutesUntilCutoff / 60);
          const mins = m.minutesUntilCutoff % 60;
          const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
          return (
            <motion.div
              key={m.marketId}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 text-sm text-orange-800"
            >
              <Clock className="shrink-0 mt-0.5" size={17} />
              <div>
                <p className="font-bold">
                  {m.marketName} — order in {timeStr}
                </p>
                <p className="mt-0.5 opacity-80">
                  Cutoff is {m.cutoffTime}. After that, your order moves to the next delivery on {m.dayName} ({m.nextDeliveryDate}).
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Price disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-sm text-amber-800"
      >
        <AlertTriangle className="shrink-0 mt-0.5" size={17} />
        <div>
          <p className="font-bold">Price Disclaimer</p>
          <p className="text-amber-700/80 mt-0.5">Market prices fluctuate daily. Prices shown are estimates; final prices are confirmed at checkout.</p>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Left: Cart Items + Delivery ── */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence initial={false}>
            {cart.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink truncate">{item.name}</h3>
                  <p className="text-sm text-muted mt-0.5">{formatCurrency(item.price)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-ink">{formatCurrency(item.price * item.quantity)}</span>
                  <motion.button
                    onClick={() => removeFromCart(item.id)}
                    className="size-9 flex items-center justify-center rounded-xl text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Delivery Details */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center gap-3"
            >
              <Lock size={18} className="text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">Sign in to complete your order</p>
                <p className="text-xs text-amber-700 mt-0.5">You need an account to enter a delivery address and checkout.</p>
              </div>
              <a href="/login" className="shrink-0 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors">Sign in</a>
            </motion.div>
          )}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5"
            >
              <h3 className="font-bold text-ink flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Delivery Details
              </h3>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-muted">Delivery Address</label>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(v => !v)}
                    className="flex items-center gap-1 text-xs text-primary font-bold hover:text-primary-dark transition-colors"
                  >
                    <Plus size={12} /> New address
                  </button>
                </div>
                {addresses.length > 0 && !showAddressForm && (
                  <select className={selectClass} value={selectedAddressId} onChange={e => setSelectedAddressId(e.target.value)}>
                    <option value="">Select address…</option>
                    {addresses.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.label || 'Address'}{a.landmarkDescription ? ` — ${a.landmarkDescription}` : ''}{a.isDefault ? ' (default)' : ''}
                      </option>
                    ))}
                  </select>
                )}
                {(addresses.length === 0 || showAddressForm) && (
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 space-y-3">
                    <input
                      type="text"
                      placeholder="Label (e.g. Home, Office)"
                      value={newAddr.label}
                      onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <textarea
                      placeholder="Landmark / full address (e.g. Near Shoprite, 15 Allen Ave, Ikeja)"
                      value={newAddr.landmarkDescription}
                      onChange={e => setNewAddr(p => ({ ...p, landmarkDescription: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddAddress}
                        disabled={addingAddress}
                        className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors"
                      >
                        {addingAddress ? 'Saving…' : 'Save Address'}
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="px-4 py-2.5 border border-gray-200 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* State → LGA selection → auto zone detection */}
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">
                  Your Location
                </label>
                <div className="relative">
                  <StateCitySelect
                    defaultState={selectedState}
                    defaultLga={selectedLga}
                    onSelect={handleLocationSelect}
                  />
                  {isLookingUpZone && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
                      <Loader2 size={12} className="animate-spin" /> Detecting your delivery zone…
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted mt-1">
                  Select your state then your LGA — we'll automatically match you to a delivery zone.
                </p>
              </div>

              {/* Zone lookup result */}
              <AnimatePresence>
                {zoneLookup && (
                  <motion.div
                    key="zone-result"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {zoneLookup.found ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                          <Check size={15} />
                          Zone matched: {zoneLookup.zone.name}
                        </div>

                        {isMultiMarket && (
                          <p className="text-xs text-emerald-600 mt-1">
                            Your cart has items from multiple markets — delivery will be consolidated on our scheduled consolidation day.
                          </p>
                        )}

                        {isLoadingFee ? (
                          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5">
                            <Loader2 size={12} className="animate-spin" /> Calculating delivery fee…
                          </p>
                        ) : deliveryFeeResult ? (
                          deliveryFeeResult.contactPrice ? (
                            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                              <p className="text-sm font-semibold text-amber-800 mb-2">
                                Delivery pricing for your area requires a quote.
                              </p>
                              <a
                                href={`tel:${deliveryFeeResult.contactPhone}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors"
                              >
                                <Phone size={14} /> Call us: {deliveryFeeResult.contactPhone}
                              </a>
                            </div>
                          ) : (
                            <p className="text-sm text-emerald-700 font-semibold mt-1">
                              Delivery fee: {formatCurrency(deliveryFeeResult.fee)}
                              {deliveryFeeResult.isConsolidated && <span className="font-normal text-xs ml-1">(consolidated)</span>}
                            </p>
                          )
                        ) : null}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-700 mb-1">
                          Sorry, we don't currently deliver to your area.
                        </p>
                        <p className="text-xs text-red-500 mb-3">
                          We're expanding! Contact us and we'll see what we can arrange.
                        </p>
                        <a
                          href={`tel:${zoneLookup.contactPhone}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
                        >
                          <Phone size={14} /> Call us: {zoneLookup.contactPhone}
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24"
          >
            <h3 className="text-lg font-black text-ink mb-5">Order Summary</h3>

            {/* Promo code */}
            <AnimatePresence mode="wait">
              {promoApplied ? (
                <motion.div
                  key="applied"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-3 mb-5"
                >
                  <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold">
                    <Check size={14} className="shrink-0" />
                    <span>{promoApplied.code}</span>
                    {promoApplied.description && (
                      <span className="text-emerald-500 font-normal hidden sm:inline">— {promoApplied.description}</span>
                    )}
                  </div>
                  <button onClick={() => setPromoApplied(null)} className="text-emerald-400 hover:text-emerald-600 transition-colors ml-2">
                    <X size={14} />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2 mb-5">
                  <div className="relative flex-1">
                    <Tag size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all tracking-wider font-mono"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoInput.trim()}
                    className="px-4 text-sm font-bold bg-ink text-white rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isApplyingPromo ? '…' : 'Apply'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fee breakdown */}
            <div className="space-y-3 mb-6 text-sm text-muted">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
                <span className="font-semibold text-ink">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee (5%)</span>
                <span className="font-semibold text-ink">{formatCurrency(serviceFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery fee</span>
                <span className="font-semibold text-ink">
                  {!zoneLookup ? (
                    <span className="text-amber-500 text-xs">Enter city</span>
                  ) : !zoneLookup.found ? (
                    <span className="text-red-500 text-xs">Zone not served</span>
                  ) : isLoadingFee ? (
                    <span className="text-gray-400 text-xs">Calculating…</span>
                  ) : deliveryFeeResult?.contactPrice ? (
                    <span className="text-amber-600 text-xs">Contact for price</span>
                  ) : deliveryFeeResult ? (
                    formatCurrency(deliveryFeeResult.fee)
                  ) : (
                    <span className="text-amber-500 text-xs">Enter city</span>
                  )}
                </span>
              </div>
              {promoApplied && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex justify-between text-emerald-600 font-bold"
                >
                  <span>Discount</span>
                  <span>−{formatCurrency(discount)}</span>
                </motion.div>
              )}
              <div className="flex justify-between font-black text-ink pt-3 border-t border-gray-100 text-base">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Checkout button or Contact CTA */}
            {contactPhone ? (
              <a
                href={`tel:${contactPhone}`}
                className="w-full flex items-center justify-center gap-2 py-4 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-colors"
              >
                <Phone size={16} /> Call to arrange delivery
              </a>
            ) : (
              <>
                <motion.button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || !selectedZoneId}
                  title={!selectedZoneId ? 'Select your delivery location above to continue' : undefined}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isCheckingOut ? 1 : 1.02 }}
                  whileTap={{ scale: isCheckingOut ? 1 : 0.98 }}
                >
                  {isCheckingOut ? (
                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Pay with Flutterwave <ArrowRight size={16} /></>
                  )}
                </motion.button>
                {!selectedZoneId && !isCheckingOut && (
                  <p className="text-xs text-center text-amber-600 mt-1 font-medium">
                    ↑ Enter your delivery location to proceed
                  </p>
                )}
              </>
            )}

            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted">
              <Lock size={12} />
              Secured by Flutterwave
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Price-change confirmation modal ── */}
      <AnimatePresence>
        {priceChanges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <RefreshCw size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Prices have changed</h3>
                  <p className="text-sm text-gray-500">Market prices updated since you added these items.</p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {priceChanges.map(c => (
                  <div key={c.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                    <span className="font-medium text-gray-800 truncate mr-4">{c.name}</span>
                    <div className="text-right shrink-0">
                      <span className="line-through text-gray-400 mr-2">{formatCurrency(c.oldPrice)}</span>
                      <span className={`font-bold ${c.newPrice > c.oldPrice ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(c.newPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mb-5">
                Your cart will continue with the updated prices. You can remove items before confirming.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => { setPriceChanges([]); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-sm"
                >
                  Review Cart
                </button>
                <button
                  onClick={handleConfirmPriceChange}
                  disabled={isCheckingOut}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 text-sm flex items-center justify-center gap-1.5"
                >
                  {isCheckingOut ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Confirm & Pay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
