import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { Package, ChevronDown, Wifi, ArrowRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GridSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

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

function getStatusCfg(status: string) {
  return STATUS_CONFIG[status] ?? { label: status.replace(/_/g, ' '), color: 'text-gray-600 bg-gray-50' };
}

function parseInstructions(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace('/api', '') ?? 'http://localhost:5000';

// Single socket shared across all order cards
let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(SOCKET_URL, { withCredentials: true });
  }
  return sharedSocket;
}

function OrderCard({ order, liveStatus }: { order: Order; liveStatus: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const effectiveStatus = liveStatus || order.status;
  const { label, color } = getStatusCfg(effectiveStatus);
  const details = parseInstructions(order.specialInstructions);

  const isArtisan  = order.orderNumber.startsWith('AYF-ART');
  const isShortlet = order.orderNumber.startsWith('AYF-SHT');
  const isRequest  = order.orderNumber.startsWith('AYF-REQ');

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

async function fetchOrders(): Promise<Order[]> {
  const { data } = await axios.get('/orders');
  return data;
}

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Live status map: orderId → status string
  const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  // Single socket — join all order rooms at once
  const joinRooms = useCallback((orderList: Order[]) => {
    if (orderList.length === 0) return;
    const socket = getSocket();

    const onConnect = () => {
      orderList.forEach(o => socket.emit('join:order', o.id));
    };

    if (socket.connected) {
      onConnect();
    } else {
      socket.once('connect', onConnect);
    }

    const onStatus = (payload: { orderId: string; status: string }) => {
      setLiveStatuses(prev => ({ ...prev, [payload.orderId]: payload.status }));
    };

    socket.on('order:status', onStatus);
    return () => { socket.off('order:status', onStatus); };
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
  }, [user, navigate]);

  useEffect(() => {
    if (orders.length > 0) return joinRooms(orders);
  }, [orders, joinRooms]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8 gap-4"
      >
        <h1 className="text-3xl font-black text-ink tracking-tight">My Orders</h1>
        <Link
          to="/marketplace"
          className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary-dark transition-colors"
        >
          Shop more <ArrowRight size={14} />
        </Link>
      </motion.div>

      {isLoading ? (
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
    </div>
  );
}
