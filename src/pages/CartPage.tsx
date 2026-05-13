import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';
import { Trash2, ArrowRight, AlertTriangle, MapPin, ChevronDown, Tag, X, Check, ShoppingCart, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import type { FlutterWaveResponse } from 'flutterwave-react-v3/dist/types';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

interface DeliveryZone {
  id: string;
  name: string;
  deliveryFeeNgn: number;
}

interface Address {
  id: string;
  label: string | null;
  landmarkDescription: string | null;
  isDefault: boolean;
  deliveryZone?: { id: string; name: string } | null;
}

const SERVICE_FEE_RATE = 0.05;

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

const selectClass = 'w-full p-3.5 bg-surface border border-gray-200 rounded-2xl text-sm appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

export default function CartPage() {
  const { cart, removeFromCart, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [flwConfig, setFlwConfig] = useState<FlwConfig | null>(null);

  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountNgn: number; description?: string } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const serviceFee = Math.round(total * SERVICE_FEE_RATE);
  const deliveryFee = selectedZone ? Number(selectedZone.deliveryFeeNgn) : 0;
  const discount = promoApplied?.discountNgn ?? 0;
  const grandTotal = total + serviceFee + deliveryFee - discount;

  useEffect(() => {
    axios.get('/admin/delivery-zones').then(r => setZones(r.data)).catch(() => {});
    if (user) {
      axios.get('/auth/addresses').then(r => {
        setAddresses(r.data);
        const def = r.data.find((a: Address) => a.isDefault);
        if (def) {
          setSelectedAddressId(def.id);
          if (def.deliveryZone?.id) setSelectedZoneId(def.deliveryZone.id);
        }
      }).catch(() => {});
    }
  }, [user]);

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

  const handleCheckout = async () => {
    if (!user) return navigate('/login');
    if (!selectedAddressId) return showToast('Please select a delivery address', 'warning');
    if (!selectedZoneId) return showToast('Please select a delivery zone', 'warning');

    setIsCheckingOut(true);
    try {
      const { data } = await axios.post('/checkout/initiate-payment', {
        items: cart.map(i => ({ id: i.id, quantity: i.quantity })),
        deliveryAddressId: selectedAddressId,
        deliveryZoneId: selectedZoneId,
        promoCode: promoApplied?.code,
      });

      setFlwConfig({
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
        tx_ref: data.paymentReference,
        amount: data.order.total,
        currency: 'NGN',
        payment_options: 'card,ussd,banktransfer',
        customer: data.flutterwavePayload?.customer ?? { email: user.email ?? '', name: 'Customer' },
        customizations: { title: 'Ayanfe Hub Checkout', description: `Order ${data.order.orderNumber}` },
        meta: { orderId: data.order.id },
      });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Checkout failed. Please try again.', 'error');
      setIsCheckingOut(false);
    }
  };

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

              {addresses.length > 0 ? (
                <div>
                  <label className="block text-xs font-bold text-muted mb-1.5">Delivery Address</label>
                  <div className="relative">
                    <select className={selectClass} value={selectedAddressId} onChange={e => setSelectedAddressId(e.target.value)}>
                      <option value="">Select address…</option>
                      {addresses.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.label || 'Address'}{a.landmarkDescription ? ` — ${a.landmarkDescription}` : ''}{a.isDefault ? ' (default)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  </div>
                </div>
              ) : (
                <Link to="/profile" className="flex items-center gap-1.5 text-sm text-primary font-bold hover:text-primary-dark transition-colors">
                  <span>+</span> Add a delivery address
                </Link>
              )}

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">Delivery Zone</label>
                <div className="relative">
                  <select className={selectClass} value={selectedZoneId} onChange={e => setSelectedZoneId(e.target.value)}>
                    <option value="">Select zone…</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name} — {formatCurrency(z.deliveryFeeNgn)}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>
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
                  {selectedZone ? formatCurrency(deliveryFee) : <span className="text-amber-500 text-xs">Select zone</span>}
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

            {/* Checkout button */}
            <motion.button
              onClick={handleCheckout}
              disabled={isCheckingOut}
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

            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted">
              <Lock size={12} />
              Secured by Flutterwave
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
