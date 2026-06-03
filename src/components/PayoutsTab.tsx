import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Banknote, Clock, CheckCircle2, XCircle, Info } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

/* ─── Types ──────────────────────────────────────────────────── */
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
  vendor: { businessName: string } | null;
  artisan: { name: string } | null;
}

/* ─── Config ─────────────────────────────────────────────────── */
const PAYOUT_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:    { label: 'Pending',    color: 'text-amber-700 bg-amber-50 border-amber-200',     icon: <Clock size={12} />        },
  SUCCESSFUL: { label: 'Successful', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={12} /> },
  FAILED:     { label: 'Failed',     color: 'text-red-700 bg-red-50 border-red-200',           icon: <XCircle size={12} />      },
};

/* ─── Fetcher ────────────────────────────────────────────────── */
async function fetchPayouts(): Promise<Payout[]> {
  const { data } = await axios.get('/payouts');
  return data;
}

/* ─── Payout row card ────────────────────────────────────────── */
function PayoutCard({ payout }: { payout: Payout }) {
  const cfg = PAYOUT_STATUS[payout.status] ?? { label: payout.status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: null };
  const recipient = payout.vendor?.businessName ?? payout.artisan?.name ?? 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      {/* Icon */}
      <div className={cn(
        'size-11 rounded-2xl flex items-center justify-center shrink-0',
        payout.status === 'SUCCESSFUL' ? 'bg-emerald-50' :
        payout.status === 'FAILED'     ? 'bg-red-50' : 'bg-amber-50'
      )}>
        <Banknote size={20} className={
          payout.status === 'SUCCESSFUL' ? 'text-emerald-600' :
          payout.status === 'FAILED'     ? 'text-red-500' : 'text-amber-600'
        } />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-bold text-ink text-sm">{formatCurrency(payout.amount)}</p>
          <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border', cfg.color)}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        <p className="text-xs text-muted">
          To: {recipient} · {payout.bankName ?? payout.bankCode} ···{payout.bankAccountNumber.slice(-4)}
        </p>
        <p className="text-xs text-muted mt-0.5">
          Ref: <span className="font-mono">{payout.reference}</span> ·{' '}
          {new Date(payout.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
        </p>
        {payout.failureReason && (
          <p className="text-xs text-red-600 mt-1 font-medium">{payout.failureReason}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function PayoutsTab() {
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['payouts'],
    queryFn: fetchPayouts,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const totalEarned = payouts
    .filter(p => p.status === 'SUCCESSFUL')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payouts
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-black text-ink text-xl">Payouts</h2>
        <p className="text-sm text-muted mt-0.5">Your earnings transferred to your bank account</p>
      </div>

      {/* Summary cards */}
      {!isLoading && payouts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-emerald-600 mb-1">Total Received</p>
            <p className="text-xl font-black text-emerald-700">{formatCurrency(totalEarned)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-600 mb-1">Pending</p>
            <p className="text-xl font-black text-amber-700">{formatCurrency(totalPending)}</p>
          </div>
        </div>
      )}

      {/* Info notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-6 text-xs text-blue-700">
        <Info size={14} className="shrink-0 mt-0.5" />
        <p>Payouts are initiated by the Ayanfe admin team after order fulfillment. Ensure your bank details are up to date in your profile settings.</p>
      </div>

      {/* Payout list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-16">
          <div className="size-16 rounded-3xl bg-surface flex items-center justify-center mx-auto mb-4">
            <Banknote size={28} className="text-muted" />
          </div>
          <p className="font-bold text-ink mb-1">No payouts yet</p>
          <p className="text-sm text-muted max-w-xs mx-auto">
            Payouts appear here once the admin team transfers your earnings. Keep fulfilling orders!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map(p => <PayoutCard key={p.id} payout={p} />)}
        </div>
      )}

      {/* Loader2 removed — skeleton above already communicates loading state */}
    </div>
  );
}
