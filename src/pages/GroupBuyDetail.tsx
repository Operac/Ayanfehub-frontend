import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, AlertCircle, CheckCircle2, ChevronLeft,
  Minus, Plus, ShoppingBag, X
} from 'lucide-react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import type { FlutterWaveResponse } from 'flutterwave-react-v3/dist/types';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCountdown } from '../hooks/useCountdown';
import type { GroupBuyEvent } from './GroupBuyList';

interface DetailEvent extends GroupBuyEvent { filledSlots: number }

async function fetchEvent(id: string): Promise<DetailEvent> {
  const { data } = await axios.get(`/group-buy/${id}`);
  return data;
}

// Slot grid: anonymous circles showing filled vs empty
function SlotGrid({ total, filled }: { total: number; filled: number }) {
  const MAX_DISPLAY = 20;
  const displayTotal = Math.min(total, MAX_DISPLAY);
  const displayFilled = Math.min(filled, displayTotal);
  const hasMore = total > MAX_DISPLAY;

  return (
    <div>
      <p className="text-xs text-muted font-semibold mb-2 uppercase tracking-wide">Slot overview</p>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: displayTotal }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.02, type: 'spring', stiffness: 400 }}
            className={cn(
              'size-7 rounded-full',
              i < displayFilled ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-gray-100'
            )}
          />
        ))}
        {hasMore && (
          <div className="size-7 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-[9px] font-black text-muted">+{total - MAX_DISPLAY}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted mt-2">
        <span className="font-bold text-primary">{filled}</span> claimed ·{' '}
        <span className="font-bold text-ink">{total - filled}</span> remaining
      </p>
    </div>
  );
}

// Payment hook wrapper — re-init when config changes
function GroupBuyPayButton({
  config,
  onSuccess,
  disabled,
  children,
}: {
  config: any;
  onSuccess: (ref: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const handlePayment = useFlutterwave(config as any);

  return (
    <button
      disabled={disabled}
      onClick={() =>
        handlePayment({
          callback: (res: FlutterWaveResponse) => {
            closePaymentModal();
            if (res.status === 'successful') onSuccess(res.transaction_id?.toString() ?? res.tx_ref);
          },
          onClose: () => {},
        })
      }
      className="flex-1 flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
    >
      {children}
    </button>
  );
}

export default function GroupBuyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [slots, setSlots] = useState(1);
  const [waitlistSlots, setWaitlistSlots] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [payConfig, setPayConfig] = useState<any>(null);
  const [initiatingPay, setInitiatingPay] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['group-buy', id],
    queryFn: () => fetchEvent(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const deadlineCountdown = useCountdown(event?.reservationDeadline ?? null);
  const payCountdown      = useCountdown(event?.mySlot?.paymentDeadline ?? null);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['group-buy'] });
    queryClient.invalidateQueries({ queryKey: ['group-buy', id] });
  }, [queryClient, id]);

  const handleReserve = async () => {
    if (!user) return navigate('/login');
    setReserving(true);
    try {
      await axios.post(`/group-buy/${id}/reserve`, { slotsCount: slots });
      showToast(`${slots} slot${slots > 1 ? 's' : ''} reserved!`, 'success');
      invalidate();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Could not reserve slot', 'error');
    } finally { setReserving(false); }
  };

  const handleCancelReservation = async () => {
    setCancelling(true);
    try {
      await axios.delete(`/group-buy/${id}/reserve`);
      showToast('Reservation cancelled', 'success');
      setConfirmCancel(false);
      invalidate();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Could not cancel reservation', 'error');
    } finally { setCancelling(false); }
  };

  const handleInitiatePay = async () => {
    if (!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY) {
      showToast('Payment unavailable right now', 'error'); return;
    }
    setInitiatingPay(true);
    try {
      const { data } = await axios.post(`/group-buy/${id}/pay`);
      setPayConfig({
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: data.paymentReference,
        amount: data.amount,
        currency: 'NGN',
        payment_options: 'card,ussd,banktransfer',
        customer: data.flutterwavePayload.customer,
        customizations: data.flutterwavePayload.customizations,
        meta: data.flutterwavePayload.meta,
      });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Could not initiate payment', 'error');
    } finally { setInitiatingPay(false); }
  };

  const handlePaySuccess = (_ref: string) => {
    showToast("You're in! We'll notify you when the group buy is confirmed.", 'success');
    setPayConfig(null);
    invalidate();
  };

  const handleJoinWaitlist = async () => {
    if (!user) return navigate('/login');
    setJoiningWaitlist(true);
    try {
      await axios.post(`/group-buy/${id}/waitlist`, { slotsWanted: waitlistSlots });
      showToast("You're on the waitlist! We'll notify you if a slot opens.", 'success');
      invalidate();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Could not join waitlist', 'error');
    } finally { setJoiningWaitlist(false); }
  };

  const handleLeaveWaitlist = async () => {
    try {
      await axios.delete(`/group-buy/${id}/waitlist`);
      showToast('Removed from waitlist', 'success');
      invalidate();
    } catch { showToast('Could not leave waitlist', 'error'); }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded-2xl w-1/3" />
          <div className="h-64 bg-gray-100 rounded-3xl" />
          <div className="h-48 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!event) return <div className="p-12 text-center text-muted">Event not found.</div>;

  const isOpen    = event.status === 'OPEN';
  const isPaying  = event.status === 'PAYING';
  const isFull    = event.status === 'FULL';
  const mySlot    = event.mySlot;
  const isMySlotUnpaid = mySlot?.status === 'RESERVED';
  const isMySlotPaid   = mySlot?.status === 'PAID';
  const canReserve = isOpen && !mySlot;
  const canPayNow  = (isPaying || isFull) && isMySlotUnpaid;
  const canWaitlist = (isFull || isPaying) && !mySlot && !event.myWaitlistEntry;

  const maxSlotsCanClaim = Math.min(event.maxSlotsPerCustomer, event.slotsRemaining);

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-12">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6 transition-colors">
        <ChevronLeft size={16} /> Back to Group Buys
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* ── Left column ───────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image */}
          <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={64} className="text-primary/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow">{event.title}</h1>
            </div>
          </div>

          {event.description && (
            <p className="text-muted leading-relaxed">{event.description}</p>
          )}

          {/* Slot grid */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <SlotGrid total={event.totalSlots} filled={event.filledSlots} />
          </div>

          {/* Countdown */}
          {isOpen && (
            <div className={cn(
              'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold',
              deadlineCountdown.urgent ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
            )}>
              <Clock size={16} className="shrink-0" />
              Reservation closes in <span className="font-black">{deadlineCountdown.label}</span>
            </div>
          )}

          {/* Urgent payment banner */}
          {canPayNow && event.mySlot?.paymentDeadline && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold',
                payCountdown.urgent ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
              )}
            >
              <AlertCircle size={16} className="shrink-0" />
              ⚠️ Pay within <span className="font-black">{payCountdown.label}</span> or your slot will be released
            </motion.div>
          )}

          {/* Confirmed slot */}
          {isMySlotPaid && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 bg-emerald-50 text-emerald-700 rounded-2xl px-4 py-4"
            >
              <CheckCircle2 size={20} className="shrink-0" />
              <div>
                <p className="font-black">You're in!</p>
                <p className="text-sm">
                  {mySlot?.slotsCount} slot{(mySlot?.slotsCount ?? 1) > 1 ? 's' : ''} paid —{' '}
                  {formatCurrency(mySlot?.totalAmountNgn ?? 0)} total
                </p>
              </div>
            </motion.div>
          )}

          {/* Waitlist status */}
          {event.myWaitlistEntry && (
            <div className="flex items-center justify-between bg-blue-50 text-blue-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users size={16} />
                {event.myWaitlistEntry.status === 'OFFERED'
                  ? '🎉 A slot is available! Reserve it now.'
                  : "You're on the waitlist — we'll notify you if a slot opens."}
              </div>
              <button onClick={handleLeaveWaitlist} className="text-blue-500 hover:text-blue-700 p-1">
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ── Right column — action panel ───────────── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-5">
            {/* Price display */}
            <div>
              <p className="text-xs text-muted uppercase font-bold tracking-wide mb-1">Price per slot</p>
              <p className="text-4xl font-black text-primary">{formatCurrency(event.pricePerSlotNgn)}</p>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Reserve panel */}
            {canReserve && (
              <>
                <div>
                  <p className="text-sm font-bold text-ink mb-3">How many slots?</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSlots(s => Math.max(1, s - 1))}
                      className="size-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-surface transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-2xl font-black text-ink w-8 text-center">{slots}</span>
                    <button
                      onClick={() => setSlots(s => Math.min(maxSlotsCanClaim, s + 1))}
                      className="size-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-surface transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1.5">Max {event.maxSlotsPerCustomer} per customer</p>
                </div>

                {/* Price breakdown */}
                <div className="bg-surface rounded-2xl p-4 space-y-2 text-sm">
                  {Array.from({ length: Math.min(event.maxSlotsPerCustomer, 5) }, (_, i) => i + 1).map(n => (
                    <div key={n} className={cn('flex justify-between', n === slots ? 'font-black text-ink' : 'text-muted')}>
                      <span>{n} slot{n > 1 ? 's' : ''}</span>
                      <span>{formatCurrency(n * event.pricePerSlotNgn)}</span>
                    </div>
                  ))}
                  {event.maxSlotsPerCustomer > 5 && (
                    <p className="text-xs text-muted text-center pt-1">Up to {event.maxSlotsPerCustomer} slots per customer</p>
                  )}
                </div>

                <div className="bg-primary/5 rounded-2xl px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-ink">Your total</span>
                  <span className="text-xl font-black text-primary">{formatCurrency(slots * event.pricePerSlotNgn)}</span>
                </div>

                <button
                  onClick={handleReserve}
                  disabled={reserving}
                  className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-2xl shadow-lg shadow-primary/30 disabled:opacity-50 transition-colors text-lg"
                >
                  {reserving ? 'Reserving…' : `Reserve ${slots} Slot${slots > 1 ? 's' : ''}`}
                </button>
                <p className="text-xs text-center text-muted">
                  No payment now — you'll pay when the group is complete.
                </p>
              </>
            )}

            {/* Existing reservation */}
            {mySlot && !isMySlotPaid && (
              <>
                <div className="bg-primary/5 rounded-2xl p-4">
                  <p className="text-sm font-bold text-ink mb-1">Your reservation</p>
                  <p className="text-2xl font-black text-primary">{mySlot.slotsCount} slot{mySlot.slotsCount > 1 ? 's' : ''}</p>
                  <p className="text-sm text-muted">{formatCurrency(mySlot.totalAmountNgn)} total</p>
                </div>

                {canPayNow && (
                  payConfig ? (
                    <GroupBuyPayButton config={payConfig} onSuccess={handlePaySuccess}>
                      Complete Payment — {formatCurrency(mySlot.totalAmountNgn)}
                    </GroupBuyPayButton>
                  ) : (
                    <button
                      onClick={handleInitiatePay}
                      disabled={initiatingPay}
                      className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-500/30 disabled:opacity-50 transition-colors text-lg"
                    >
                      {initiatingPay ? 'Loading…' : `Pay Now — ${formatCurrency(mySlot.totalAmountNgn)}`}
                    </button>
                  )
                )}

                {isOpen && (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full py-3 border border-gray-200 text-muted hover:text-red-600 hover:border-red-200 text-sm font-semibold rounded-2xl transition-colors"
                  >
                    Cancel reservation
                  </button>
                )}
              </>
            )}

            {/* Paid slot */}
            {isMySlotPaid && (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2" />
                <p className="font-black text-ink">Payment confirmed</p>
                <p className="text-sm text-muted mt-1">
                  We'll notify you when the full group is confirmed.
                </p>
              </div>
            )}

            {/* Waitlist CTA */}
            {canWaitlist && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-ink">Slots wanted</label>
                  <select
                    value={waitlistSlots}
                    onChange={e => setWaitlistSlots(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {Array.from({ length: event.maxSlotsPerCustomer }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} slot{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleJoinWaitlist}
                  disabled={joiningWaitlist}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl disabled:opacity-50 transition-colors text-lg"
                >
                  {joiningWaitlist ? 'Joining…' : 'Join Waitlist'}
                </button>
              </div>
            )}

            {/* Event info */}
            <div className="text-xs text-muted space-y-1.5 pt-2 border-t border-gray-100">
              <p className="flex justify-between"><span>Payment window</span><span className="font-bold text-ink">{event.paymentDeadlineHours}h after group fills</span></p>
              <p className="flex justify-between"><span>Deadline</span><span className="font-bold text-ink">{new Date(event.reservationDeadline).toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span></p>
              <p className="flex justify-between"><span>Max per customer</span><span className="font-bold text-ink">{event.maxSlotsPerCustomer} slots</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
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
              <h3 className="font-black text-ink text-lg mb-2">Cancel reservation?</h3>
              <p className="text-sm text-muted mb-6">
                Your slot will be released and may be offered to someone on the waitlist.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmCancel(false)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-muted hover:bg-surface transition-colors">
                  Keep it
                </button>
                <button onClick={handleCancelReservation} disabled={cancelling} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-sm font-bold disabled:opacity-50 transition-colors">
                  {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
