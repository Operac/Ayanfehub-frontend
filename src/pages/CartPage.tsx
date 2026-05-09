import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';
import { Trash2, ArrowRight, AlertTriangle, MapPin, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
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

function FlutterwaveModal({ config, onSuccess, onClose }: {
  config: Record<string, unknown>;
  onSuccess: (ref: string) => void;
  onClose: () => void;
}) {
  const handlePayment = useFlutterwave(config as any);

  useEffect(() => {
    handlePayment({
      callback: (response: any) => {
        closePaymentModal();
        if (response.status === 'successful') {
          onSuccess(response.transaction_id);
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

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [flwConfig, setFlwConfig] = useState<Record<string, unknown> | null>(null);

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const serviceFee = Math.round(total * SERVICE_FEE_RATE);
  const deliveryFee = selectedZone ? Number(selectedZone.deliveryFeeNgn) : 0;
  const grandTotal = total + serviceFee + deliveryFee;

  useEffect(() => {
    axios.get('/checkout/delivery', { params: { marketIds: [] } }).catch(() => {});

    // Fetch delivery zones from API — reuse the zones table
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
      });

      const config = {
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
        tx_ref: data.paymentReference,
        amount: data.order.total,
        currency: 'NGN',
        payment_options: 'card,ussd,banktransfer',
        customer: data.flutterwavePayload?.customer ?? { email: user.email ?? '', name: 'Customer' },
        customizations: {
          title: 'Ayanfe Hub Checkout',
          description: `Order ${data.order.orderNumber}`,
        },
        meta: { orderId: data.order.id },
      };

      setFlwConfig(config);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Checkout failed. Please try again.', 'error');
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Start shopping from our local markets.</p>
        <Link to="/marketplace" className="bg-primary text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition">
          Browse Markets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {flwConfig && (
        <FlutterwaveModal
          config={flwConfig}
          onSuccess={onPaymentSuccess}
          onClose={onPaymentClose}
        />
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex gap-3 text-amber-800 text-sm">
        <AlertTriangle className="shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-semibold">Price Disclaimer</p>
          <p>Market prices fluctuate daily. Prices shown are estimates; final prices are confirmed at checkout.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">{formatCurrency(item.price)} × {item.quantity}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {/* Delivery Setup */}
          {user && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-primary" /> Delivery Details
              </h3>

              {/* Address selector */}
              {addresses.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Delivery Address</label>
                  <div className="relative">
                    <select
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm appearance-none pr-10"
                      value={selectedAddressId}
                      onChange={e => setSelectedAddressId(e.target.value)}
                    >
                      <option value="">Select address…</option>
                      {addresses.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.label || 'Address'}{a.landmarkDescription ? ` — ${a.landmarkDescription}` : ''}{a.isDefault ? ' (default)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <Link to="/profile" className="block text-sm text-primary font-medium hover:underline">
                  + Add a delivery address
                </Link>
              )}

              {/* Zone selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Delivery Zone</label>
                <div className="relative">
                  <select
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm appearance-none pr-10"
                    value={selectedZoneId}
                    onChange={e => setSelectedZoneId(e.target.value)}
                  >
                    <option value="">Select zone…</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.name} — {formatCurrency(z.deliveryFeeNgn)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>

            <div className="space-y-2 mb-6 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee (5%)</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{selectedZone ? formatCurrency(deliveryFee) : <span className="text-amber-600 text-xs">Select zone</span>}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2 text-base">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? 'Preparing payment…' : 'Pay with Flutterwave'}
              {!isCheckingOut && <ArrowRight size={18} />}
            </button>

            <p className="text-xs text-center text-gray-400 mt-4">
              🔒 Secured by Flutterwave
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
