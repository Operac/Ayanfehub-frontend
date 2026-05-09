import { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, ChevronDown, ChevronUp, Wifi } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useOrderSocket } from '../hooks/useOrderSocket';

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
  DELIVERED:        { label: 'Delivered',         color: 'text-green-700 bg-green-50'  },
  PAYMENT_CONFIRMED:{ label: 'Confirmed',          color: 'text-blue-700 bg-blue-50'   },
  SOURCING:         { label: 'Sourcing Items',     color: 'text-amber-700 bg-amber-50' },
  AT_HUB:           { label: 'At Hub',             color: 'text-purple-700 bg-purple-50'},
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',   color: 'text-indigo-700 bg-indigo-50'},
  PENDING_PAYMENT:  { label: 'Awaiting Payment',   color: 'text-amber-700 bg-amber-50' },
  PENDING:          { label: 'Pending',            color: 'text-gray-600 bg-gray-50'   },
  CANCELLED:        { label: 'Cancelled',          color: 'text-red-700 bg-red-50'     },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status.replace(/_/g, ' '), color: 'text-gray-600 bg-gray-50' };
}

function parseSpecialInstructions(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const { liveStatus, statusLabel: liveLabel } = useOrderSocket(order.id);
  const effectiveStatus = liveStatus || order.status;
  const { label, color } = getStatusConfig(effectiveStatus);
  const displayLabel = liveLabel || label;
  const details = parseSpecialInstructions(order.specialInstructions);

  const isArtisan  = order.orderNumber.startsWith('AYF-ART');
  const isShortlet = order.orderNumber.startsWith('AYF-SHT');
  const isRequest  = order.orderNumber.startsWith('AYF-REQ');

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs font-mono text-gray-400 mb-1">{order.orderNumber}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', color)}>{displayLabel}</span>
              {liveStatus && <Wifi size={12} className="text-green-500" title="Live status" />}
              {isArtisan  && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-700 bg-orange-50">Artisan</span>}
              {isShortlet && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-700 bg-blue-50">Shortlet</span>}
              {isRequest  && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-purple-700 bg-purple-50">Custom Request</span>}
            </div>
            <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</p>
          </div>
          <div className="text-right">
            <span className="block font-bold text-gray-900 text-lg">{formatCurrency(Number(order.totalNgn))}</span>
          </div>
        </div>

        {/* Summary line for special order types */}
        {(isArtisan || isShortlet || isRequest) && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-3">
            {isArtisan  && <p>{(details.serviceName as string) || 'Artisan service'} — {(details.address as string) || 'Address on file'}</p>}
            {isShortlet && (details.checkIn && details.checkOut)
              ? <p>Stay: {new Date(details.checkIn as string).toLocaleDateString()} → {new Date(details.checkOut as string).toLocaleDateString()}</p>
              : isShortlet && <p>Shortlet booking</p>
            }
            {isRequest  && <p>{(details.description as string) || 'Custom service request'}</p>}
          </div>
        )}

        {/* Marketplace items */}
        {order.items.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 transition"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {expanded && order.items.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {order.items.map(item => (
            <div key={item.id} className="px-6 py-3 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-gray-900">{item.product?.name ?? 'Item'}</p>
                <p className="text-xs text-gray-400">Qty: {item.quantity} × {formatCurrency(Number(item.unitPriceNgn))}</p>
              </div>
              <span className="font-semibold text-gray-900">
                {formatCurrency(item.quantity * Number(item.unitPriceNgn))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    axios.get('/orders')
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500 bg-gray-50 rounded-2xl">
          <Package size={40} className="mx-auto mb-4 text-gray-300" />
          <p>You haven't placed any orders yet.</p>
        </div>
      )}
    </div>
  );
}
