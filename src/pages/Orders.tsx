import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Package, ChevronDown, Wifi, ArrowRight, Users, Clock, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, X, KeyRound, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useCountdown } from '../hooks/useCountdown';
import DisputesTab from '../components/DisputesTab';
import CleaningOrdersTab from '../components/CleaningOrdersTab';

/* ─── Order types ────────────────────────────────────────────── */
interface OrderItem {
  id: string;
  quantity: number;
  unitPriceNgn: string | number;
  product: { name: string; unit: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalNgn: string | number;
  createdAt: string;
  specialInstructions: string | null;
  items: OrderItem[];
}

/* ─── Group Buy types ────────────────────────────────────────── */
interface MyGroupBuySlot {
  id: string;
  slotsCount: number;
  status: string;
  paymentDeadline: string | null;
  paidAt: string | null;
  totalAmountNgn: number;
}

interface MyGroupBuyEvent {
  id: string;
  title: string;
  imageUrl: string | null;
  pricePerSlotNgn: number;
  status: string;
  mySlot: MyGroupBuySlot | null;
  myWaitlistEntry: { id: string; slotsWanted: number; status: string } | null;
}

/* ─── Order status config ────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DELIVERED:         { label: 'Delivered',        color: 'text-green-700 bg-green-50'   },
  PAYMENT_CONFIRMED: { label: 'Confirmed',         color: 'text-blue-700 bg-blue-50'    },
  SOURCING:          { label: 'Sourcing Items',    color: 'text-amber-700 bg-amber-50'  },
  AT_HUB:            { label: 'At Hub',            color: 'text-purple-700 bg-purple-50'},
  OUT_FOR_DELIVERY:  { label: 'Out for Delivery',  color: 'text-indigo-700 bg-indigo-50'},
  PENDING_PAYMENT:   { label: 'Awaiting Payment',  color: 'text-amber-700 bg-amber-50' },
  CANCELLED:         { label: 'Cancelled',         color: 'text-red-700 bg-red-50'      },
  REFUND_INITIATED:  { label: 'Refund Initiated',  color: 'text-orange-700 bg-orange-50'},
};

const GB_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN:      { label: 'Open',       color: 'text-emerald-700 bg-emerald-50' },
  FULL:      { label: 'Full',       color: 'text-amber-700 bg-amber-50'    },
  PAYING:    { label: 'Pay Now',    color: 'text-orange-700 bg-orange-50'  },
  CONFIRMED: { label: 'Confirmed',  color: 'text-blue-700 bg-blue-50'      },
  CANCELLED: { label: 'Cancelled',  color: 'text-red-700 bg-red-50'        },
  FULFILLED: { label: 'Fulfilled',  color: 'text-gray-700 bg-gray-100'     },
};

const SLOT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  RESERVED: { label: 'Reserved — Pending Payment', color: 'text-amber-700 bg-amber-50'   },
  PAID:     { label: 'Paid',                        color: 'text-emerald-700 bg-emerald-50' },
  RELEASED: { label: 'Slot Released',               color: 'text-red-700 bg-red-50'        },
  REFUNDED: { label: 'Refunded',                    color: 'text-gray-700 bg-gray-100'     },
};

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? { label: status.replace(/_/g, ' '), color: 'text-gray-600 bg-gray-50' };
}

function parseInstructions(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace('/api', '') ?? 'http://localhost:5000';

let sharedSocket: Socket | null = null;
function getSocket(): Socket {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(SOCKET_URL, { withCredentials: true });
  }
  return sharedSocket;
}

/* ─── Order card ─────────────────────────────────────────────── */
function OrderCard({ order, liveStatus, onCancel, onVerify, cancelling }: {
  order: Order;
  liveStatus: string | null;
  onCancel: (orderId: string) => void;
  onVerify: (orderId: string, orderNumber: string) => void;
  cancelling: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const effectiveStatus = liveStatus || order.status;
  const { label, color } = getStatusCfg(effectiveStatus);
  const details = parseInstructions(order.specialInstructions);

  const isArtisan  = order.orderNumber.startsWith('AYF-ART');
  const isShortlet = order.orderNumber.startsWith('AYF-SHT');
  const isRequest  = order.orderNumber.startsWith('AYF-REQ');

  const canCancel = effectiveStatus === 'PENDING_PAYMENT';
  const canVerify = effectiveStatus === 'OUT_FOR_DELIVERY';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden"
    >
      <div className="p-5 sm:p-6">
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="min-w-0">
            <p className="text-xs font-mono text-muted mb-1.5 truncate">{order.orderNumber}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('px-3 py-1 rounded-full text-xs font-bold', color)}>{label}</span>
              {liveStatus && <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><Wifi size={11} /> Live</span>}
              {isArtisan  && <span className="px-2.5 py-1 rounded-full text-xs font-bold text-orange-700 bg-orange-50">Artisan</span>}
              {isShortlet && <span className="px-2.5 py-1 rounded-full text-xs font-bold text-blue-700 bg-blue-50">Shortlet</span>}
              {isRequest  && <span className="px-2.5 py-1 rounded-full text-xs font-bold text-purple-700 bg-purple-50">Custom</span>}
            </div>
            <p className="text-xs text-muted mt-1.5">
              {new Date(order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
            </p>
          </div>
          <span className="font-black text-ink text-lg shrink-0">{formatCurrency(Number(order.totalNgn))}</span>
        </div>

        {(isArtisan || isShortlet || isRequest) && (
          <div className="bg-surface rounded-2xl p-3.5 text-sm text-muted mb-4">
            {isArtisan  && <p>{(details.serviceName as string) || 'Artisan service'} — {(details.address as string) || 'Address on file'}</p>}
            {isShortlet && (details.checkIn && details.checkOut)
              ? <p>Stay: {new Date(details.checkIn as string).toLocaleDateString()} → {new Date(details.checkOut as string).toLocaleDateString()}</p>
              : isShortlet && <p>Shortlet booking</p>}
            {isRequest  && <p>{(details.description as string) || 'Custom service request'}</p>}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {order.items.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition-colors"
            >
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} />
              </motion.div>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            {canVerify && (
              <button
                onClick={() => onVerify(order.id, order.orderNumber)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <KeyRound size={12} /> Confirm Delivery
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(order.id)}
                disabled={cancelling === order.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                aria-label="Cancel order"
              >
                {cancelling === order.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && order.items.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100 divide-y divide-gray-50"
          >
            {order.items.map(item => (
              <div key={item.id} className="px-5 sm:px-6 py-3.5 flex items-center justify-between text-sm gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{item.product?.name ?? 'Item'}</p>
                  <p className="text-xs text-muted mt-0.5">Qty: {item.quantity} × {formatCurrency(Number(item.unitPriceNgn))}</p>
                </div>
                <span className="font-bold text-ink shrink-0">
                  {formatCurrency(item.quantity * Number(item.unitPriceNgn))}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Group Buy card ─────────────────────────────────────────── */
function GroupBuyCard({ event }: { event: MyGroupBuyEvent }) {
  const slot = event.mySlot;
  const waitlist = event.myWaitlistEntry;
  const eventCfg = GB_STATUS_CONFIG[event.status] ?? { label: event.status, color: 'text-gray-600 bg-gray-50' };
  const slotCfg = slot ? (SLOT_STATUS_CONFIG[slot.status] ?? { label: slot.status, color: 'text-gray-600 bg-gray-50' }) : null;

  const isPayingAndUnpaid = event.status === 'PAYING' && slot?.status === 'RESERVED';
  const { label: countdown, urgent } = useCountdown(isPayingAndUnpaid ? slot?.paymentDeadline : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white border rounded-3xl shadow-sm overflow-hidden',
        isPayingAndUnpaid ? 'border-orange-200 ring-1 ring-orange-300' : 'border-gray-100'
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex gap-4">
          {/* Image thumbnail */}
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="size-14 rounded-2xl object-cover shrink-0"
            />
          ) : (
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users size={22} className="text-primary/50" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-black text-ink text-base leading-tight truncate">{event.title}</h3>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold shrink-0', eventCfg.color)}>
                {eventCfg.label}
              </span>
            </div>

            {/* Slot info */}
            {slot && slotCfg && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', slotCfg.color)}>
                  {slotCfg.label}
                </span>
                <span className="text-xs text-muted">
                  {slot.slotsCount} slot{slot.slotsCount !== 1 ? 's' : ''} · {formatCurrency(slot.totalAmountNgn)}
                </span>
                {slot.paidAt && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 size={11} /> Paid {new Date(slot.paidAt).toLocaleDateString('en-NG', { dateStyle: 'short' })}
                  </span>
                )}
              </div>
            )}

            {/* Waitlist info */}
            {!slot && waitlist && (
              <div className="mt-1 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-purple-700 bg-purple-50">
                  On Waitlist
                </span>
                <span className="text-xs text-muted">{waitlist.slotsWanted} slot{waitlist.slotsWanted !== 1 ? 's' : ''} requested</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment deadline warning */}
        {isPayingAndUnpaid && slot?.paymentDeadline && (
          <div className="mt-4 flex items-center justify-between gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle size={14} className="shrink-0" />
              <span className="text-xs font-semibold">Pay before your slot is released</span>
            </div>
            <span className={cn('text-xs font-black flex items-center gap-1', urgent ? 'text-red-600' : 'text-orange-700')}>
              <Clock size={11} /> {countdown}
            </span>
          </div>
        )}

        {/* Action button */}
        <div className="mt-4 flex justify-end">
          <Link
            to={`/group-buy/${event.id}`}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors',
              isPayingAndUnpaid
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
            )}
          >
            {isPayingAndUnpaid ? 'Pay Now ⚡' : 'View Details'}
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Data fetchers ──────────────────────────────────────────── */
async function fetchOrders(): Promise<Order[]> {
  const { data } = await axios.get('/orders');
  return data;
}

async function fetchMyGroupBuys(): Promise<MyGroupBuyEvent[]> {
  const { data } = await axios.get('/group-buy/my');
  return data;
}

/* ─── Tab definitions ────────────────────────────────────────── */
type Tab = 'orders' | 'group-buys' | 'disputes' | 'cleaning';

/* ─── Main page ─────────────────────────────────────────────── */
export default function Orders() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const initialTab = (location.state as any)?.tab as Tab | undefined;
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? 'orders');
  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});

  // Delivery verification modal
  const [verifyModal, setVerifyModal]   = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [verifyCode, setVerifyCode]     = useState('');
  const [verifying, setVerifying]       = useState(false);
  const [cancelling, setCancelling]     = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null); // orderId awaiting confirmation

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const { data: groupBuys = [], isLoading: gbLoading } = useQuery({
    queryKey: ['my-group-buys'],
    queryFn: fetchMyGroupBuys,
    enabled: !!user,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const joinRooms = useCallback((orderList: Order[]) => {
    if (orderList.length === 0) return;
    const socket = getSocket();
    const onConnect = () => { orderList.forEach(o => socket.emit('join:order', o.id)); };
    if (socket.connected) { onConnect(); } else { socket.once('connect', onConnect); }
    const onStatus = (payload: { orderId: string; status: string }) => {
      setLiveStatuses(prev => ({ ...prev, [payload.orderId]: payload.status }));
    };
    socket.on('order:status', onStatus);
    return () => { socket.off('order:status', onStatus); };
  }, []);

  useEffect(() => {
    if (!user) {
      // Tear down shared socket so the next login gets a fresh authenticated connection
      if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (orders.length > 0) return joinRooms(orders);
  }, [orders, joinRooms]);

  const handleCancelOrder = async (orderId: string) => {
    setCancelling(orderId);
    setCancelConfirm(null);
    try {
      await axios.post(`/orders/${orderId}/cancel`);
      setLiveStatuses(prev => ({ ...prev, [orderId]: 'CANCELLED' }));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      showToast('Order cancelled', 'success');
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Failed to cancel order', 'error');
    } finally {
      setCancelling(null);
    }
  };

  const handleVerifyDelivery = async () => {
    if (!verifyModal || verifyCode.length !== 6) return;
    setVerifying(true);
    try {
      await axios.post('/orders/verify-delivery', { orderId: verifyModal.orderId, code: verifyCode });
      setLiveStatuses(prev => ({ ...prev, [verifyModal.orderId]: 'DELIVERED' }));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      showToast('Delivery confirmed! Thank you.', 'success');
      setVerifyModal(null);
      setVerifyCode('');
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Invalid code. Please try again.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const payingCount = groupBuys.filter(
    e => e.status === 'PAYING' && e.mySlot?.status === 'RESERVED'
  ).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 gap-4"
      >
        <h1 className="text-3xl font-black text-ink tracking-tight">My Purchases</h1>
        <Link
          to="/marketplace"
          className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-dark transition-colors"
        >
          Shop more <ArrowRight size={14} />
        </Link>
      </motion.div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-2 px-2 pb-1 mb-8">
      <div className="flex gap-1 p-1 bg-surface rounded-2xl w-fit min-w-max">
        {([
          { id: 'orders',     label: 'Orders',      icon: <Package size={14} />     },
          { id: 'group-buys', label: 'Group Buys',  icon: <Users size={14} />,      badge: payingCount },
          { id: 'cleaning',   label: 'Cleaning',    icon: <Sparkles size={14} />    },
          { id: 'disputes',   label: 'Disputes',    icon: <ShieldAlert size={14} /> },
        ] as { id: Tab; label: string; icon: React.ReactNode; badge?: number }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200',
              activeTab === tab.id
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            )}
          >
            {tab.icon}
            {tab.label}
            {!!tab.badge && tab.badge > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-[9px] font-black">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      </div>

      {/* Tab: Orders */}
      <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18 }}
          >
            {ordersLoading ? (
              <GridSkeleton count={3} variant="order" />
            ) : orders.length > 0 ? (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
                className="space-y-4"
              >
                {orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    liveStatus={liveStatuses[order.id] ?? null}
                    onCancel={(id) => setCancelConfirm(id)}
                    onVerify={(id, num) => { setVerifyModal({ orderId: id, orderNumber: num }); setVerifyCode(''); }}
                    cancelling={cancelling}
                  />
                ))}
              </motion.div>
            ) : (
              <EmptyState
                icon={<Package size={36} />}
                title="No orders yet"
                description="Start shopping from our local Lagos markets."
                action={{ label: 'Browse Markets', to: '/marketplace' }}
              />
            )}
          </motion.div>
        )}

        {/* Tab: Group Buys */}
        {activeTab === 'group-buys' && (
          <motion.div
            key="group-buys"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {gbLoading ? (
              <GridSkeleton count={3} variant="order" />
            ) : groupBuys.length > 0 ? (
              <div className="space-y-4">
                {groupBuys.map(event => (
                  <GroupBuyCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Users size={36} />}
                title="No group buys yet"
                description="Join a group buy to unlock bulk pricing with other customers."
                action={{ label: 'Browse Group Buys', to: '/group-buy' }}
              />
            )}
          </motion.div>
        )}
        {/* Tab: Cleaning */}
        {activeTab === 'cleaning' && (
          <motion.div
            key="cleaning"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <CleaningOrdersTab />
          </motion.div>
        )}

        {/* Tab: Disputes */}
        {activeTab === 'disputes' && (
          <motion.div
            key="disputes"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <DisputesTab />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cancel Confirmation Modal ── */}
      <AnimatePresence>
        {cancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6"
            >
              <h3 className="text-lg font-bold text-ink mb-2">Cancel Order?</h3>
              <p className="text-sm text-muted mb-6">This action cannot be undone. Are you sure you want to cancel this order?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelConfirm(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-ink hover:bg-gray-50 transition-colors"
                >
                  Keep Order
                </button>
                <button
                  onClick={() => handleCancelOrder(cancelConfirm)}
                  disabled={cancelling === cancelConfirm}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling === cancelConfirm ? <Loader2 size={14} className="animate-spin" /> : null}
                  Yes, Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delivery Verification Modal ── */}
      <AnimatePresence>
        {verifyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) { setVerifyModal(null); setVerifyCode(''); } }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-ink">Confirm Delivery</h3>
                  <p className="text-xs text-muted mt-0.5">{verifyModal.orderNumber}</p>
                </div>
                <button onClick={() => { setVerifyModal(null); setVerifyCode(''); }} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X size={16} className="text-muted" />
                </button>
              </div>
              <p className="text-sm text-muted mb-5">
                Enter the 6-digit code your delivery agent gives you to confirm receipt of your order.
              </p>
              <div className="flex gap-2 justify-center mb-6">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-black tracking-[0.4em] border-2 border-gray-200 rounded-2xl py-4 focus:outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setVerifyModal(null); setVerifyCode(''); }}
                  className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-muted hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyDelivery}
                  disabled={verifyCode.length !== 6 || verifying}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  {verifying ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {verifying ? 'Verifying…' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
