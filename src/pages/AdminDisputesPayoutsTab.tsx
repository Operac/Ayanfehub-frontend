import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, XCircle, Clock, ChevronDown,
  Banknote, Plus, Search, RefreshCw, X,
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
interface Dispute {
  id: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'REJECTED';
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  order: { id: string; orderNumber: string; status: string };
  user: { id: string; fullName: string | null; email: string; phone: string } | null;
}

interface Payout {
  id: string;
  amount: number;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  reference: string;
  bankAccountNumber: string;
  bankCode: string;
  bankName: string | null;
  failureReason: string | null;
  createdAt: string;
  vendor: { id: string; businessName: string } | null;
  artisan: { id: string; name: string } | null;
}

interface Bank { id: string; code: string; name: string; }
interface VendorOption { id: string; businessName: string; verificationStatus: string }
interface ArtisanOption { id: string; name: string; verificationStatus: string }

/* ══════════════════════════════════════════════════════════════
   DISPUTES SECTION
══════════════════════════════════════════════════════════════ */
const DISPUTE_STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN:                { label: 'Open',                color: 'text-amber-700 bg-amber-50 border-amber-200',      icon: <Clock size={11} />        },
  UNDER_INVESTIGATION: { label: 'Investigating',       color: 'text-blue-700 bg-blue-50 border-blue-200',         icon: <Search size={11} />       },
  RESOLVED:            { label: 'Resolved',            color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={11} /> },
  REJECTED:            { label: 'Rejected',            color: 'text-red-700 bg-red-50 border-red-200',            icon: <XCircle size={11} />      },
};

function ResolveModal({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'UNDER_INVESTIGATION' | 'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [resolution, setResolution] = useState('');

  const mutation = useMutation({
    mutationFn: () => axios.patch(`/disputes/${dispute.id}`, {
      status,
      resolution: resolution.trim() || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      showToast('Dispute updated successfully', 'success');
      onClose();
    },
    onError: (err: any) => {
      showToast(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to update dispute', 'error');
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-black text-ink">Update Dispute</h3>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-xl hover:bg-surface">
            <X size={15} className="text-muted" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Dispute summary */}
          <div className="bg-surface rounded-2xl p-4 text-sm">
            <p className="font-bold text-ink mb-1">{dispute.reason}</p>
            <p className="text-muted text-xs leading-relaxed">{dispute.description}</p>
            <p className="text-muted text-xs mt-2">
              {dispute.user?.fullName ?? dispute.user?.email} · {dispute.order.orderNumber}
            </p>
          </div>

          {/* New status */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">New Status *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['UNDER_INVESTIGATION', 'RESOLVED', 'REJECTED'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors',
                    status === s ? 'bg-primary text-white border-primary' : 'border-gray-200 text-muted hover:border-primary/40'
                  )}
                >
                  {s === 'UNDER_INVESTIGATION' ? 'Investigating' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution note */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Resolution Note (optional)</label>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              placeholder="Explain the outcome to the customer…"
              className="input-base resize-none"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-muted hover:bg-surface">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <CheckCircle2 size={14} />}
            Update
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DisputeRow({ dispute }: { dispute: Dispute }) {
  const [expanded, setExpanded] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const cfg = DISPUTE_STATUS_CFG[dispute.status] ?? { label: dispute.status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: null };
  const isActionable = dispute.status !== 'RESOLVED' && dispute.status !== 'REJECTED';

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border', cfg.color)}>
                  {cfg.icon}{cfg.label}
                </span>
                <span className="text-xs font-mono text-muted">{dispute.order.orderNumber}</span>
              </div>
              <p className="font-bold text-ink text-sm">{dispute.reason}</p>
              <p className="text-xs text-muted mt-0.5">
                {dispute.user?.fullName ?? dispute.user?.email ?? '—'} ·{' '}
                {new Date(dispute.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isActionable && (
                <button
                  onClick={() => setShowResolve(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Update
                </button>
              )}
              <button
                onClick={() => setExpanded(v => !v)}
                className="size-8 flex items-center justify-center rounded-xl hover:bg-surface transition-colors"
              >
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} className="text-muted" />
                </motion.div>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="px-5 py-4 space-y-3">
                <div>
                  <p className="text-xs font-bold text-muted mb-1">Customer description</p>
                  <p className="text-sm text-ink leading-relaxed">{dispute.description}</p>
                </div>
                {dispute.resolution && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-emerald-700 mb-1">Resolution note</p>
                    <p className="text-sm text-emerald-800">{dispute.resolution}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showResolve && <ResolveModal dispute={dispute} onClose={() => setShowResolve(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAYOUTS SECTION
══════════════════════════════════════════════════════════════ */
const PAYOUT_STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'Pending',    color: 'text-amber-700 bg-amber-50 border-amber-200'      },
  SUCCESSFUL: { label: 'Successful', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  FAILED:     { label: 'Failed',     color: 'text-red-700 bg-red-50 border-red-200'            },
};

function InitiatePayoutModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [recipientType, setRecipientType] = useState<'vendor' | 'artisan'>('vendor');
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [acctNum, setAcctNum] = useState('');
  const [acctName, setAcctName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ['banks'],
    queryFn: async () => { const { data } = await axios.get('/payouts/banks'); return data; },
    staleTime: 60 * 60 * 1000,
  });

  const { data: vendors = [] } = useQuery<VendorOption[]>({
    queryKey: ['admin-vendors-list'],
    queryFn: async () => { const { data } = await axios.get('/admin/vendors'); return data; },
    staleTime: 5 * 60 * 1000,
  });

  const { data: artisans = [] } = useQuery<ArtisanOption[]>({
    queryKey: ['admin-artisans-list'],
    queryFn: async () => { const { data } = await axios.get('/artisans'); return data; },
    staleTime: 5 * 60 * 1000,
  });

  const handleVerify = async () => {
    if (!bankCode || acctNum.length !== 10) return;
    setIsVerifying(true);
    setAcctName('');
    try {
      const { data } = await axios.post('/payouts/verify-bank', { accountNumber: acctNum, bankCode });
      setAcctName(data.accountName);
      showToast(`Verified: ${data.accountName}`, 'success');
    } catch (err: any) {
      showToast(axios.isAxiosError(err) ? err.response?.data?.message : 'Verification failed', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const mutation = useMutation({
    mutationFn: () => axios.post('/payouts/initiate', {
      [recipientType === 'vendor' ? 'vendorId' : 'artisanId']: recipientId,
      amount: Number(amount),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      showToast('Payout initiated successfully', 'success');
      onClose();
    },
    onError: (err: any) => {
      showToast(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to initiate payout', 'error');
    },
  });

  const canSubmit = recipientId && Number(amount) > 0;
  const verifiedRecipients = recipientType === 'vendor'
    ? vendors.filter(v => v.verificationStatus === 'VERIFIED')
    : artisans.filter(a => a.verificationStatus === 'VERIFIED');

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Banknote size={18} className="text-primary" />
            </div>
            <h3 className="font-black text-ink">Initiate Payout</h3>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-xl hover:bg-surface">
            <X size={15} className="text-muted" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Recipient type toggle */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Recipient Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['vendor', 'artisan'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setRecipientType(t); setRecipientId(''); }}
                  className={cn(
                    'py-2.5 rounded-xl text-sm font-bold border capitalize transition-colors',
                    recipientType === t ? 'bg-primary text-white border-primary' : 'border-gray-200 text-muted hover:border-primary/40'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient selector */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              {recipientType === 'vendor' ? 'Vendor' : 'Artisan'} *{' '}
              <span className="font-normal text-muted/70">(verified only)</span>
            </label>
            <div className="relative">
              <select
                value={recipientId}
                onChange={e => setRecipientId(e.target.value)}
                className="input-base appearance-none pr-10"
              >
                <option value="">Select…</option>
                {verifiedRecipients.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.businessName ?? r.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">Amount (NGN) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm font-bold">₦</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="input-base pl-8"
              />
            </div>
            {Number(amount) > 0 && (
              <p className="text-xs text-muted mt-1">{formatCurrency(Number(amount))}</p>
            )}
          </div>

          {/* Bank verification (informational only — the actual bank details come from the recipient record) */}
          <div className="bg-surface rounded-2xl p-4 text-xs text-muted space-y-2">
            <p className="font-bold text-ink text-xs">Bank Account Verification</p>
            <p>To verify a recipient's bank details before payout, enter their bank + account number below. This is optional — payout uses the bank details saved on the recipient's profile.</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Bank</label>
                <div className="relative">
                  <select
                    value={bankCode}
                    onChange={e => setBankCode(e.target.value)}
                    className="input-base appearance-none pr-8 text-xs"
                  >
                    <option value="">Select…</option>
                    {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Acct Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={acctNum}
                  onChange={e => setAcctNum(e.target.value.replace(/\D/g, ''))}
                  placeholder="0123456789"
                  className="input-base text-xs"
                />
              </div>
            </div>
            <button
              onClick={handleVerify}
              disabled={isVerifying || !bankCode || acctNum.length !== 10}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-1"
            >
              {isVerifying ? <span className="size-3 border border-primary border-t-transparent rounded-full animate-spin" /> : <Search size={12} />}
              Verify Account
            </button>
            {acctName && (
              <p className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> {acctName}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-muted hover:bg-surface">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Banknote size={14} />}
            {mutation.isPending ? 'Initiating…' : 'Initiate Payout'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
type Section = 'disputes' | 'payouts';

export default function AdminDisputesPayoutsTab() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>('disputes');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [disputeFilter, setDisputeFilter] = useState<string>('ALL');

  /* ── Queries ── */
  const { data: disputes = [], isLoading: disputesLoading } = useQuery<Dispute[]>({
    queryKey: ['admin-disputes'],
    queryFn: async () => { const { data } = await axios.get('/disputes'); return data; },
    staleTime: 60 * 1000,
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useQuery<Payout[]>({
    queryKey: ['admin-payouts'],
    queryFn: async () => { const { data } = await axios.get('/payouts'); return data; },
    staleTime: 60 * 1000,
  });

  /* ── Sync payout status ── */
  const syncMutation = useMutation({
    mutationFn: (id: string) => axios.post(`/payouts/${id}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      showToast('Payout status synced', 'success');
    },
    onError: () => showToast('Sync failed', 'error'),
  });

  const filteredDisputes = disputeFilter === 'ALL'
    ? disputes
    : disputes.filter(d => d.status === disputeFilter);

  const FILTER_OPTIONS = ['ALL', 'OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'REJECTED'];

  return (
    <div>
      {/* Section switcher */}
      <div className="flex gap-1 p-1 bg-surface rounded-2xl mb-8 w-fit border border-gray-100">
        {([
          { id: 'disputes', label: 'Disputes',  icon: <AlertCircle size={13} /> },
          { id: 'payouts',  label: 'Payouts',   icon: <Banknote size={13} />    },
        ] as { id: Section; label: string; icon: React.ReactNode }[]).map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
              section === s.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
            )}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Disputes ── */}
        {section === 'disputes' && (
          <motion.div key="disputes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h2 className="font-black text-ink text-xl">Customer Disputes</h2>
              <div className="flex gap-2 flex-wrap">
                {FILTER_OPTIONS.map(f => (
                  <button
                    key={f}
                    onClick={() => setDisputeFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors',
                      disputeFilter === f ? 'bg-ink text-white' : 'bg-surface text-muted hover:text-ink'
                    )}
                  >
                    {f === 'ALL' ? 'All' : f === 'UNDER_INVESTIGATION' ? 'Investigating' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {disputesLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
            ) : filteredDisputes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <AlertCircle size={28} className="mx-auto mb-3 text-muted opacity-40" />
                <p className="font-bold text-ink mb-1">No disputes</p>
                <p className="text-sm text-muted">No {disputeFilter !== 'ALL' ? disputeFilter.toLowerCase() : ''} disputes found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDisputes.map(d => <DisputeRow key={d.id} dispute={d} />)}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Payouts ── */}
        {section === 'payouts' && (
          <motion.div key="payouts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="font-black text-ink text-xl">Payouts</h2>
                <p className="text-sm text-muted mt-0.5">Manage vendor and artisan earnings transfers</p>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
              >
                <Plus size={14} />
                Initiate Payout
              </button>
            </div>

            {/* Summary */}
            {!payoutsLoading && payouts.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {(['PENDING', 'SUCCESSFUL', 'FAILED'] as const).map(s => {
                  const count = payouts.filter(p => p.status === s).length;
                  const total = payouts.filter(p => p.status === s).reduce((sum, p) => sum + p.amount, 0);
                  const cfg = PAYOUT_STATUS_CFG[s];
                  return (
                    <div key={s} className={cn('rounded-2xl p-4 border', cfg.color)}>
                      <p className="text-xs font-bold mb-1">{cfg.label}</p>
                      <p className="text-lg font-black">{formatCurrency(total)}</p>
                      <p className="text-xs opacity-70 mt-0.5">{count} payout{count !== 1 ? 's' : ''}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {payoutsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />)}</div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Banknote size={28} className="mx-auto mb-3 text-muted opacity-40" />
                <p className="font-bold text-ink mb-1">No payouts yet</p>
                <p className="text-sm text-muted">Initiate your first payout using the button above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payouts.map(p => {
                  const cfg = PAYOUT_STATUS_CFG[p.status] ?? { label: p.status, color: 'text-gray-600 bg-gray-50 border-gray-200' };
                  const recipient = p.vendor?.businessName ?? p.artisan?.name ?? 'Unknown';
                  return (
                    <div key={p.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-surface flex items-center justify-center shrink-0">
                        <Banknote size={18} className="text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-bold text-ink text-sm">{formatCurrency(p.amount)}</p>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold border', cfg.color)}>{cfg.label}</span>
                        </div>
                        <p className="text-xs text-muted">
                          {recipient} · {p.bankName ?? p.bankCode} ···{p.bankAccountNumber.slice(-4)}
                        </p>
                        <p className="text-xs text-muted mt-0.5 font-mono">{p.reference}</p>
                        {p.failureReason && <p className="text-xs text-red-500 mt-0.5">{p.failureReason}</p>}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <p className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString('en-NG', { dateStyle: 'short' })}</p>
                        {p.status === 'PENDING' && (
                          <button
                            onClick={() => syncMutation.mutate(p.id)}
                            disabled={syncMutation.isPending}
                            title="Sync status from Flutterwave"
                            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark disabled:opacity-40 transition-colors"
                          >
                            <RefreshCw size={11} className={syncMutation.isPending ? 'animate-spin' : ''} />
                            Sync
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayoutModal && <InitiatePayoutModal onClose={() => setShowPayoutModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
