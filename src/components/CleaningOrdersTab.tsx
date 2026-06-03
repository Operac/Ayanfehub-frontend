import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import type { FlutterWaveResponse } from 'flutterwave-react-v3/dist/types';
import {
  Home, Building2, HardHat, Clock, MapPin, CreditCard,
  ChevronDown, AlertCircle, Loader2,
  Camera, FileText, User, Phone,
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import EmptyState from './EmptyState';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CleaningRequest {
  id: string;
  requestNumber: string;
  category: 'HOME' | 'OFFICE' | 'CONSTRUCTION';
  serviceTypes: string[];
  propertyType: string | null;
  squareFootage: number | null;
  roomCount: number | null;
  isRecurring: boolean;
  recurringFreq: string | null;
  location: string;
  preferredDate: string;
  preferredTime: string | null;
  photoUrls: string[];
  specialRequest: string | null;
  status: 'PENDING_QUOTE' | 'INSPECTION_SCHEDULED' | 'QUOTED' | 'DEPOSIT_PAID' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assessmentType: 'REMOTE' | 'IN_PERSON';
  inspectionScheduledAt: string | null;
  inspectionNote: string | null;
  quoteAmountNgn: string | null;
  depositAmountNgn: string | null;
  quoteNotes: string | null;
  quotedAt: string | null;
  assignedCleanerName: string | null;
  assignedCleanerPhone: string | null;
  completedAt: string | null;
  createdAt: string;
}

const CAT_META: Record<string, { icon: React.FC<any>; color: string; gradient: string; label: string }> = {
  HOME:         { icon: Home,      color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600',  label: 'Home Cleaning'              },
  OFFICE:       { icon: Building2, color: 'text-blue-600',    gradient: 'from-blue-500 to-indigo-600',   label: 'Office Cleaning'            },
  CONSTRUCTION: { icon: HardHat,   color: 'text-orange-600',  gradient: 'from-orange-500 to-amber-600',  label: 'Construction Site Cleaning' },
};

const STATUS_CFG: Record<string, { label: string; color: string; description: string }> = {
  PENDING_QUOTE:        { label: 'Pending Quote',      color: 'text-amber-700 bg-amber-50',    description: 'Our team is reviewing your request' },
  INSPECTION_SCHEDULED: { label: 'Inspection Booked',  color: 'text-violet-700 bg-violet-50',  description: 'Our team will visit your property before sending a quote' },
  QUOTED:               { label: 'Quote Ready',        color: 'text-blue-700 bg-blue-50',      description: 'Tap "Pay Deposit" to confirm' },
  DEPOSIT_PAID:         { label: 'Deposit Paid',       color: 'text-indigo-700 bg-indigo-50',  description: 'We\'re assigning a cleaner' },
  ASSIGNED:             { label: 'Cleaner Assigned',   color: 'text-purple-700 bg-purple-50',  description: 'Your cleaner will contact you soon' },
  IN_PROGRESS:          { label: 'In Progress',        color: 'text-primary bg-primary/10',    description: 'Cleaning is underway' },
  COMPLETED:            { label: 'Completed',          color: 'text-emerald-700 bg-emerald-50', description: 'Service completed' },
  CANCELLED:            { label: 'Cancelled',          color: 'text-red-700 bg-red-50',        description: '' },
};

// Timeline steps mapping (INSPECTION_SCHEDULED sits between PENDING_QUOTE and QUOTED)
const TIMELINE = ['PENDING_QUOTE', 'INSPECTION_SCHEDULED', 'QUOTED', 'DEPOSIT_PAID', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];

// ── Pay button wrapper ────────────────────────────────────────────────────────

function PayDepositButton({
  config, onSuccess, children,
}: {
  config: any; onSuccess: () => void; children: React.ReactNode;
}) {
  const handlePayment = useFlutterwave(config);
  return (
    <button
      onClick={() => handlePayment({
        callback: (res: FlutterWaveResponse) => {
          closePaymentModal();
          if (res.status === 'successful') onSuccess();
        },
        onClose: () => {},
      })}
      className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors"
    >
      {children}
    </button>
  );
}

// ── Cleaning card ─────────────────────────────────────────────────────────────

function CleaningCard({ request }: { request: CleaningRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [payConfig, setPayConfig] = useState<any>(null);
  const [loadingPay, setLoadingPay] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const meta = CAT_META[request.category];
  const Icon = meta.icon;
  const statusCfg = STATUS_CFG[request.status] ?? { label: request.status, color: 'text-gray-600 bg-gray-50', description: '' };
  const isQuoted         = request.status === 'QUOTED';
  const isInspectionSet  = request.status === 'INSPECTION_SCHEDULED';
  const canCancel        = ['PENDING_QUOTE', 'INSPECTION_SCHEDULED', 'QUOTED'].includes(request.status);

  const handleInitiatePay = async () => {
    if (!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY) {
      showToast('Payment unavailable right now', 'error'); return;
    }
    setLoadingPay(true);
    try {
      const { data } = await axios.post(`/cleaning/${request.id}/pay-deposit`);
      setPayConfig({
        public_key:      import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref:          data.paymentReference,
        amount:          data.amount,
        currency:        'NGN',
        payment_options: 'card,ussd,banktransfer',
        customer:        data.flutterwavePayload.customer,
        customizations:  data.flutterwavePayload.customizations,
        meta:            data.flutterwavePayload.meta,
      });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Could not initiate payment', 'error');
    } finally { setLoadingPay(false); }
  };

  const handlePaySuccess = () => {
    showToast('Deposit confirmed! We\'re assigning your cleaner.', 'success');
    setPayConfig(null);
    queryClient.invalidateQueries({ queryKey: ['cleaning-my'] });
  };

  const cancelMutation = useMutation({
    mutationFn: () => axios.delete(`/cleaning/${request.id}`),
    onSuccess: () => {
      showToast('Request cancelled', 'success');
      setConfirmCancel(false);
      queryClient.invalidateQueries({ queryKey: ['cleaning-my'] });
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Could not cancel', 'error');
    },
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white border rounded-3xl shadow-sm overflow-hidden',
        isQuoted ? 'border-blue-200 ring-1 ring-blue-300'
          : isInspectionSet ? 'border-violet-200 ring-1 ring-violet-200'
          : 'border-gray-100'
      )}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-4">
          <div className={cn('size-11 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shrink-0', meta.gradient)}>
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="font-black text-ink text-sm">{meta.label}</span>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', statusCfg.color)}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs font-mono text-muted">{request.requestNumber}</p>
          </div>
        </div>

        {/* Status description */}
        {statusCfg.description && (
          <p className="text-xs text-muted bg-surface rounded-xl px-3 py-2 mb-4">{statusCfg.description}</p>
        )}

        {/* Inspection scheduled banner */}
        {isInspectionSet && request.inspectionScheduledAt && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-violet-700 mb-2">📋 Inspection scheduled</p>
            <p className="text-sm text-violet-800 font-semibold">
              {new Date(request.inspectionScheduledAt).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' at '}
              {new Date(request.inspectionScheduledAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {request.inspectionNote && (
              <p className="text-xs text-violet-700 mt-1 italic">"{request.inspectionNote}"</p>
            )}
            <p className="text-xs text-violet-600 mt-2">You'll receive a quote within 24 hours of the visit.</p>
          </div>
        )}

        {/* Quote banner */}
        {isQuoted && request.quoteAmountNgn && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-blue-700 mb-2">🎉 Your quote is ready</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted">Total quote</span>
              <span className="text-lg font-black text-ink">{formatCurrency(Number(request.quoteAmountNgn))}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-muted">Deposit required now</span>
              <span className="text-base font-black text-primary">{formatCurrency(Number(request.depositAmountNgn))}</span>
            </div>
            {request.quoteNotes && (
              <p className="text-xs text-blue-700 italic mb-3">{request.quoteNotes}</p>
            )}
            {payConfig ? (
              <PayDepositButton config={payConfig} onSuccess={handlePaySuccess}>
                <CreditCard size={14} /> Pay Deposit — {formatCurrency(Number(request.depositAmountNgn))}
              </PayDepositButton>
            ) : (
              <button
                onClick={handleInitiatePay}
                disabled={loadingPay}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-2xl text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {loadingPay ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {loadingPay ? 'Loading…' : `Pay Deposit — ${formatCurrency(Number(request.depositAmountNgn))}`}
              </button>
            )}
          </div>
        )}

        {/* Assigned cleaner */}
        {request.assignedCleanerName && (
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 mb-4">
            <User size={16} className="text-purple-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">{request.assignedCleanerName}</p>
              <p className="text-xs text-muted flex items-center gap-1">
                <Phone size={10} /> {request.assignedCleanerPhone}
              </p>
            </div>
          </div>
        )}

        {/* Quick info */}
        <div className="flex flex-wrap gap-4 text-xs text-muted mb-3">
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {request.location.length > 40 ? request.location.slice(0, 40) + '…' : request.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {new Date(request.preferredDate).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
            {request.preferredTime && ` at ${request.preferredTime}`}
          </span>
        </div>

        {/* Expand toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition-colors"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} />
            </motion.div>
            {expanded ? 'Less details' : 'More details'}
          </button>

          {canCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {/* Services */}
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {request.serviceTypes.map(s => (
                    <span key={s} className="px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold">{s}</span>
                  ))}
                </div>
              </div>

              {/* Property details */}
              {(request.propertyType || request.squareFootage || request.roomCount) && (
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Property</p>
                  <div className="text-sm text-muted">
                    {request.propertyType && <p>{request.propertyType}</p>}
                    {request.squareFootage && <p>{request.squareFootage} sq ft</p>}
                    {request.roomCount && <p>{request.roomCount} rooms / workstations</p>}
                    {request.isRecurring && request.recurringFreq && <p>Recurring: {request.recurringFreq}</p>}
                  </div>
                </div>
              )}

              {/* Special request */}
              {request.specialRequest && (
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">
                    <FileText size={11} className="inline mr-1" /> Special request
                  </p>
                  <p className="text-sm text-muted">{request.specialRequest}</p>
                </div>
              )}

              {/* Photos */}
              {request.photoUrls.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">
                    <Camera size={11} className="inline mr-1" /> Photos
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {request.photoUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="" className="size-16 rounded-xl object-cover hover:opacity-90 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {request.status !== 'CANCELLED' && (() => {
                // HOME requests skip INSPECTION_SCHEDULED in their timeline
                const tl = request.assessmentType === 'IN_PERSON'
                  ? TIMELINE
                  : TIMELINE.filter(s => s !== 'INSPECTION_SCHEDULED');
                const idx = tl.indexOf(request.status);
                return (
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Progress</p>
                    <div className="flex gap-0.5 items-start">
                      {tl.map((s, i) => {
                        const done = idx >= 0 ? i <= idx : false;
                        const cfg  = STATUS_CFG[s];
                        return (
                          <div key={s} className="flex-1 flex flex-col items-center gap-1">
                            <div className={cn('size-2.5 rounded-full transition-colors', done ? 'bg-primary' : 'bg-gray-200')} />
                            <p className={cn('text-[8px] font-bold text-center leading-tight px-0.5', done ? 'text-primary' : 'text-gray-300')}>
                              {cfg?.label.replace(' Scheduled', '').split(' ').slice(0, 2).join(' ')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(((Math.max(idx, 0) + 1) / tl.length) * 100, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel confirm modal */}
      <AnimatePresence>
        {confirmCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmCancel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
              <h3 className="font-black text-ink text-lg mb-2 text-center">Cancel request?</h3>
              <p className="text-sm text-muted mb-6 text-center">
                Are you sure you want to cancel {request.requestNumber}?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmCancel(false)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-muted">Keep it</button>
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  {cancelMutation.isPending ? 'Cancelling…' : 'Yes, cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export default function CleaningOrdersTab() {
  const navigate = useNavigate();

  const { data: requests = [], isLoading } = useQuery<CleaningRequest[]>({
    queryKey: ['cleaning-my'],
    queryFn:  async () => { const { data } = await axios.get('/cleaning/my'); return data; },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-3xl animate-pulse" />)}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title="No cleaning requests yet"
        description="Book a home, office, or construction site cleaning and get a custom quote within 24 hours."
        action={{ label: 'Book Cleaning', onClick: () => navigate('/cleaning') }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(r => <CleaningCard key={r.id} request={r} />)}
    </div>
  );
}

