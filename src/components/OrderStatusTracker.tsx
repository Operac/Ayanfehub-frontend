import { motion } from 'framer-motion';
import { Check, Clock, Truck, Package, AlertCircle } from 'lucide-react';
import { useOrderSocket } from '../hooks/useOrderSocket';

interface OrderStatusTrackerProps {
  orderId: string | null;
  initialStatus?: string;
  estimatedDeliveryAt?: string | null;
  onStatusChange?: (status: string) => void;
}

const STATUS_STAGES = [
  { key: 'PENDING_PAYMENT', label: 'Payment', icon: Clock },
  { key: 'PAYMENT_CONFIRMED', label: 'Confirmed', icon: Check },
  { key: 'SOURCING', label: 'Sourcing', icon: Package },
  { key: 'AT_HUB', label: 'At Hub', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'In Transit', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Check },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-muted',
  PENDING_PAYMENT: 'text-muted',
  PAYMENT_CONFIRMED: 'text-primary',
  SOURCING: 'text-primary',
  AT_HUB: 'text-accent',
  OUT_FOR_DELIVERY: 'text-accent',
  DELIVERED: 'text-primary-dark',
  CANCELLED: 'text-red-500',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  PENDING_PAYMENT: 'Waiting for payment confirmation',
  PAYMENT_CONFIRMED: 'Order confirmed, preparing to source items',
  SOURCING: 'Items being sourced from vendors',
  AT_HUB: 'Items consolidated at warehouse',
  OUT_FOR_DELIVERY: 'On its way to you',
  DELIVERED: 'Order delivered successfully',
  CANCELLED: 'Order was cancelled',
};

export default function OrderStatusTracker({
  orderId,
  initialStatus = 'PENDING_PAYMENT',
  estimatedDeliveryAt,
  // onStatusChange is kept for future integration with parent components
  onStatusChange: _unused,
}: OrderStatusTrackerProps) {
  const { liveStatus, statusLabel } = useOrderSocket(orderId);
  const currentStatus = liveStatus || initialStatus;

  const currentStageIndex = STATUS_STAGES.findIndex(s => s.key === currentStatus);
  const isDelivered = currentStatus === 'DELIVERED';
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-bold text-ink mb-1">Order Status</h3>
        <p className={`text-sm font-semibold ${STATUS_COLORS[currentStatus] || 'text-gray-500'}`}>
          {statusLabel || STATUS_DESCRIPTIONS[currentStatus] || 'Unknown Status'}
        </p>
      </div>

      {/* Timeline */}
      {!isCancelled ? (
        <div className="flex flex-col">
          {STATUS_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isLast = index === STATUS_STAGES.length - 1;

            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-4"
              >
                {/* Left column: icon + connector */}
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={isCurrent ? { scale: 1.1 } : {}}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isCompleted
                        ? 'bg-primary/20 text-primary-dark'
                        : 'bg-gray-100 text-gray-400'
                    } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <Icon size={20} />
                  </motion.div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-[1.5rem] my-1 transition-colors ${
                        isCompleted ? 'bg-primary/30' : 'bg-gray-100'
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-4'}`}>
                  <p
                    className={`text-sm font-semibold transition-colors pt-2 ${
                      isCompleted ? 'text-ink' : 'text-gray-400'
                    }`}
                  >
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <motion.div
                      animate={{ opacity: [0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-xs text-primary font-medium mt-0.5"
                    >
                      In progress...
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900">Order Cancelled</p>
            <p className="text-xs text-red-700 mt-0.5">This order was cancelled</p>
          </div>
        </div>
      )}

      {/* Delivery estimate */}
      {!isDelivered && !isCancelled && estimatedDeliveryAt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl"
        >
          <p className="text-xs font-semibold text-primary-dark">Expected Delivery</p>
          <p className="text-sm text-primary mt-1">
            {new Date(estimatedDeliveryAt).toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
