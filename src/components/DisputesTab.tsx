import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Plus, X, ChevronDown, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';

/* ─── Types ──────────────────────────────────────────────────── */
interface Dispute {
  id: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'REJECTED';
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
  };
}

interface OrderOption {
  id: string;
  orderNumber: string;
  status: string;
}

/* ─── Config ─────────────────────────────────────────────────── */
const DISPUTE_STATUS: Record<string, { label: string; color: string }> = {
  OPEN:                { label: 'Open',                color: 'text-muted bg-muted/10 border-muted/20'     },
  UNDER_INVESTIGATION: { label: 'Under Investigation', color: 'text-primary-dark bg-primary/10 border-primary/20' },
  RESOLVED:            { label: 'Resolved',            color: 'text-primary bg-primary/20 border-primary/30' },
  REJECTED:            { label: 'Rejected',            color: 'text-red-700 bg-red-50 border-red-200'           },
};

const DISPUTE_REASONS = [
  'Item not delivered',
  'Wrong item received',
  'Item damaged on arrival',
  'Quality not as described',
  'Overcharged / incorrect price',
  'Partial delivery',
  'Other',
];

/* ─── Fetchers ───────────────────────────────────────────────── */
async function fetchDisputes(): Promise<Dispute[]> {
  const { data } = await axios.get('/disputes');
  return data;
}

async function fetchOrders(): Promise<OrderOption[]> {
  const { data } = await axios.get('/orders');
  return data;
}

/* ─── Raise Dispute Modal ────────────────────────────────────── */
function RaiseDisputeModal({ orders, onClose }: { orders: OrderOption[]; onClose: () => void }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () => axios.post('/disputes', { orderId, reason, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      showToast('Dispute raised successfully. Our team will review it within 24 hours.', 'success');
      onClose();
    },
    onError: (err: any) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg || 'Failed to raise dispute', 'error');
    },
  });

  const canSubmit = orderId && reason.length >= 3 && description.length >= 5;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <h2 className="font-black text-ink text-lg">Raise a Dispute</h2>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-xl hover:bg-surface transition-colors">
            <X size={16} className="text-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Order selector */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Order *</label>
            <div className="relative">
              <select
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                className="input-base appearance-none pr-10"
              >
                <option value="">Select an order…</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.orderNumber} — {o.status.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Reason *</label>
            <div className="relative">
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="input-base appearance-none pr-10"
              >
                <option value="">Select a reason…</option>
                {DISPUTE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              Description * <span className="font-normal">(min 5 characters)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the issue in detail…"
              className="input-base resize-none"
            />
            <p className="text-xs text-muted mt-1 text-right">{description.length} chars</p>
          </div>

          <p className="text-xs text-muted bg-surface rounded-xl px-3.5 py-3 leading-relaxed">
            Our team reviews all disputes within 24–48 hours. You'll be notified of any updates.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-muted hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <AlertCircle size={14} />}
            {mutation.isPending ? 'Submitting…' : 'Submit Dispute'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Dispute card ───────────────────────────────────────────── */
function DisputeCard({ dispute }: { dispute: Dispute }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = DISPUTE_STATUS[dispute.status] ?? { label: dispute.status, color: 'text-gray-600 bg-gray-50 border-gray-200' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden"
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-xs font-mono text-muted mb-1">{dispute.order.orderNumber}</p>
            <p className="font-bold text-ink text-sm">{dispute.reason}</p>
          </div>
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold border shrink-0', cfg.color)}>
            {cfg.label}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted mb-3">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {new Date(dispute.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
          </span>
          {dispute.resolvedAt && (
            <span>Resolved {new Date(dispute.resolvedAt).toLocaleDateString('en-NG', { dateStyle: 'short' })}</span>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition-colors"
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={13} />
          </motion.div>
          {expanded ? 'Hide details' : 'View details'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-muted mb-1">Your description</p>
                <p className="text-sm text-ink leading-relaxed">{dispute.description}</p>
              </div>
              {dispute.resolution && (
                <div className="bg-surface rounded-2xl p-3.5">
                  <p className="text-xs font-bold text-muted mb-1">Admin resolution</p>
                  <p className="text-sm text-ink leading-relaxed">{dispute.resolution}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function DisputesTab() {
  const [showModal, setShowModal] = useState(false);

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: fetchDisputes,
    staleTime: 60 * 1000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: 5 * 60 * 1000,
  });

  // Only disputable orders: not cancelled, not pending payment
  const eligibleOrders = orders.filter(o =>
    !['PENDING_PAYMENT', 'CANCELLED'].includes(o.status)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-black text-ink text-xl">My Disputes</h2>
          <p className="text-sm text-muted mt-0.5">Track and manage issues with your orders</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-sm shadow-red-200"
        >
          <Plus size={14} />
          Raise Dispute
        </button>
      </div>

      {/* Disputes list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-3xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-16">
          <div className="size-16 rounded-3xl bg-surface flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-muted" />
          </div>
          <p className="font-bold text-ink mb-1">No disputes raised</p>
          <p className="text-sm text-muted">If you have an issue with an order, raise a dispute and we'll help resolve it.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => <DisputeCard key={d.id} dispute={d} />)}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <RaiseDisputeModal orders={eligibleOrders} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
