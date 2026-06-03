import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Users, Check, X, ChevronDown, ChevronUp,
  AlertTriangle, Eye, Pencil, Ban, Package
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AdminEvent {
  id: string;
  title: string;
  status: string;
  totalSlots: number;
  slotsRemaining: number;
  slotsReserved: number;
  slotsPaid: number;
  participantCount: number;
  pricePerSlotNgn: number;
  amountCollectedNgn: number;
  reservationDeadline: string;
  createdAt: string;
}

interface Participant {
  slotId: string;
  slotsCount: number;
  status: string;
  amountNgn: number;
  paymentReference: string | null;
  paidAt: string | null;
  reservedAt: string;
  paymentDeadline: string | null;
  customer: { id: string; fullName: string | null; phone: string; email: string | null };
}

interface CreateForm {
  title: string;
  description: string;
  imageUrl: string;
  totalSlots: string;
  pricePerSlotNgn: string;
  maxSlotsPerCustomer: string;
  paymentDeadlineHours: string;
  reservationDeadline: string;
}

const EMPTY_FORM: CreateForm = {
  title: '',
  description: '',
  imageUrl: '',
  totalSlots: '',
  pricePerSlotNgn: '',
  maxSlotsPerCustomer: '3',
  paymentDeadlineHours: '24',
  reservationDeadline: '',
};

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  OPEN:      { label: 'Open',      color: 'text-emerald-700 bg-emerald-50' },
  FULL:      { label: 'Full',      color: 'text-amber-700 bg-amber-50'     },
  PAYING:    { label: 'Paying',    color: 'text-orange-700 bg-orange-50'   },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-700 bg-blue-50'       },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700 bg-red-50'         },
  FULFILLED: { label: 'Fulfilled', color: 'text-gray-700 bg-gray-100'      },
};

const SLOT_STATUS_CFG: Record<string, { label: string; color: string }> = {
  RESERVED: { label: 'Reserved', color: 'text-amber-700 bg-amber-50'   },
  PAID:     { label: 'Paid',     color: 'text-emerald-700 bg-emerald-50'},
  RELEASED: { label: 'Released', color: 'text-gray-600 bg-gray-100'    },
  REFUNDED: { label: 'Refunded', color: 'text-blue-700 bg-blue-50'     },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

async function fetchAdminEvents(): Promise<AdminEvent[]> {
  const { data } = await axios.get('/admin/group-buy', { withCredentials: true });
  return data;
}

async function fetchParticipants(id: string): Promise<{ event: any; participants: Participant[] }> {
  const { data } = await axios.get(`/admin/group-buy/${id}/participants`, { withCredentials: true });
  return data;
}

// ── Event Form ─────────────────────────────────────────────────────────────────

function EventForm({
  initial,
  onSave,
  onCancel,
  saving,
  isEdit,
}: {
  initial: CreateForm;
  onSave: (form: CreateForm) => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  const [form, setForm] = useState<CreateForm>(initial);
  const f = (k: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const slots    = parseInt(form.totalSlots) || 0;
  const price    = parseFloat(form.pricePerSlotNgn) || 0;
  const expected = slots * price;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
      <h3 className="font-bold text-ink mb-5">{isEdit ? 'Edit Group Buy' : 'New Group Buy Event'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left */}
        <div className="space-y-4">
          <Field label="Title *">
            <input value={form.title} onChange={f('title')} placeholder="e.g. Whole Cow — Eid Special"
              className="input-base" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={f('description') as any} rows={3}
              placeholder="Describe what participants are buying…"
              className="input-base resize-none" />
          </Field>
          <Field label="Image URL">
            <input value={form.imageUrl} onChange={f('imageUrl')} placeholder="https://…"
              className="input-base" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Slots *">
              <input type="number" value={form.totalSlots} onChange={f('totalSlots')} min={1}
                className="input-base" />
            </Field>
            <Field label="Max/Customer">
              <input type="number" value={form.maxSlotsPerCustomer} onChange={f('maxSlotsPerCustomer')} min={1}
                className="input-base" />
            </Field>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <Field label="Price per Slot (₦) *">
            <input type="number" value={form.pricePerSlotNgn} onChange={f('pricePerSlotNgn')} min={1}
              className="input-base" />
          </Field>
          <Field label="Payment Window (hours)">
            <input type="number" value={form.paymentDeadlineHours} onChange={f('paymentDeadlineHours')} min={1}
              className="input-base" />
          </Field>
          <Field label="Reservation Deadline *">
            <input type="datetime-local" value={form.reservationDeadline} onChange={f('reservationDeadline')}
              className="input-base" />
          </Field>

          {/* Live preview card */}
          {form.title && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-black text-ink text-base mb-1">{form.title}</p>
              {slots > 0 && price > 0 && (
                <>
                  <p className="text-primary font-bold">{formatCurrency(price)} / slot</p>
                  <p className="text-muted text-xs mt-1">
                    {slots} slots · Expected revenue: <strong>{formatCurrency(expected)}</strong>
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 text-muted rounded-xl text-sm font-semibold hover:bg-surface transition-colors">
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={saving}
          className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5">
          <Check size={14} /> {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ── Participants modal ─────────────────────────────────────────────────────────

function ParticipantsModal({
  eventId,
  onClose,
}: {
  eventId: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [releasing, setReleasing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['group-buy-participants', eventId],
    queryFn: () => fetchParticipants(eventId),
  });

  const handleRelease = async (slotId: string) => {
    if (!confirm('Release this participant\'s slot? They will be notified and refunded if paid.')) return;
    setReleasing(slotId);
    try {
      await axios.patch(`/admin/group-buy/${eventId}/slots/${slotId}/release`, {}, { withCredentials: true });
      showToast('Slot released', 'success');
      queryClient.invalidateQueries({ queryKey: ['group-buy-participants', eventId] });
      queryClient.invalidateQueries({ queryKey: ['admin-group-buy'] });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Could not release slot', 'error');
    } finally { setReleasing(null); }
  };

  const totalExpected = (data?.participants ?? [])
    .filter(p => p.status !== 'RELEASED' && p.status !== 'REFUNDED')
    .reduce((s, p) => s + p.amountNgn, 0);
  const totalCollected = (data?.participants ?? [])
    .filter(p => p.status === 'PAID')
    .reduce((s, p) => s + p.amountNgn, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-ink">{data?.event?.title ?? 'Participants'}</h3>
            <p className="text-xs text-muted mt-0.5">
              Collected <strong>{formatCurrency(totalCollected)}</strong> of{' '}
              <strong>{formatCurrency(totalExpected)}</strong> expected
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
          {isLoading && <p className="text-sm text-muted text-center py-10">Loading…</p>}
          {!isLoading && data?.participants.length === 0 && (
            <p className="text-sm text-muted text-center py-10">No participants yet</p>
          )}
          {data?.participants.map(p => {
            const ssc = SLOT_STATUS_CFG[p.status] ?? { label: p.status, color: 'text-gray-600 bg-gray-100' };
            const canRelease = p.status === 'RESERVED' || p.status === 'PAID';
            return (
              <div key={p.slotId} className="flex items-center justify-between px-6 py-4 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-ink truncate">{p.customer.fullName ?? 'Unknown'}</p>
                  <p className="text-xs text-muted">{p.customer.phone} · {p.slotsCount} slot{p.slotsCount > 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">{formatCurrency(p.amountNgn)}</p>
                    {p.paidAt && <p className="text-[10px] text-muted">{new Date(p.paidAt).toLocaleDateString()}</p>}
                  </div>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', ssc.color)}>{ssc.label}</span>
                  {canRelease && (
                    <button
                      onClick={() => handleRelease(p.slotId)}
                      disabled={releasing === p.slotId}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Release slot"
                    >
                      <Ban size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main tab component ─────────────────────────────────────────────────────────

export default function AdminGroupBuyTab() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ id: string; title: string } | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-group-buy'],
    queryFn: fetchAdminEvents,
  });

  const handleSave = async (form: CreateForm) => {
    if (!form.title || !form.totalSlots || !form.pricePerSlotNgn || !form.reservationDeadline) {
      showToast('Please fill in all required fields', 'error'); return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      totalSlots: parseInt(form.totalSlots),
      pricePerSlotNgn: parseFloat(form.pricePerSlotNgn),
      maxSlotsPerCustomer: parseInt(form.maxSlotsPerCustomer),
      paymentDeadlineHours: parseInt(form.paymentDeadlineHours),
      reservationDeadline: new Date(form.reservationDeadline).toISOString(),
    };
    try {
      if (editingEvent) {
        await axios.patch(`/admin/group-buy/${editingEvent.id}`, payload, { withCredentials: true });
        showToast('Event updated', 'success');
      } else {
        await axios.post('/admin/group-buy', payload, { withCredentials: true });
        showToast('Group buy created & customers notified', 'success');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-group-buy'] });
      setShowForm(false);
      setEditingEvent(null);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Failed to save event', 'error');
    } finally { setSaving(false); }
  };

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await axios.patch(`/admin/group-buy/${id}/cancel`, {}, { withCredentials: true });
      showToast('Event cancelled and participants notified', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-group-buy'] });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Could not cancel event', 'error');
    } finally { setCancelling(null); setCancelConfirm(null); }
  };

  const handleFulfill = async (id: string) => {
    try {
      await axios.patch(`/admin/group-buy/${id}/fulfill`, {}, { withCredentials: true });
      showToast('Event marked as fulfilled', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-group-buy'] });
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Could not fulfill event', 'error');
    }
  };

  const openEdit = (ev: AdminEvent) => {
    setEditingEvent(ev);
    setShowForm(true);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">Group Buy Events</h2>
          <p className="text-sm text-gray-400 mt-0.5">Create and manage group purchasing events</p>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setShowForm(v => !v); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
        >
          <Plus size={15} /> New Event
        </button>
      </div>

      {/* Create / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <EventForm
              initial={editingEvent ? {
                title: editingEvent.title,
                description: '',
                imageUrl: '',
                totalSlots: String(editingEvent.totalSlots),
                pricePerSlotNgn: String(editingEvent.pricePerSlotNgn),
                maxSlotsPerCustomer: '3',
                paymentDeadlineHours: '24',
                reservationDeadline: new Date(editingEvent.reservationDeadline).toISOString().slice(0, 16),
              } : EMPTY_FORM}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingEvent(null); }}
              saving={saving}
              isEdit={!!editingEvent}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events list */}
      {isLoading && <p className="text-sm text-muted text-center py-8">Loading…</p>}
      {!isLoading && events.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No group buy events yet</p>
      )}

      <div className="space-y-3">
        {events.map(ev => {
          const cfg = STATUS_CFG[ev.status] ?? { label: ev.status, color: 'text-gray-600 bg-gray-100' };
          const fillPct = ev.totalSlots > 0 ? ((ev.totalSlots - ev.slotsRemaining) / ev.totalSlots) * 100 : 0;
          const isExpanded = expandedId === ev.id;

          return (
            <div key={ev.id} className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-ink truncate">{ev.title}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold', cfg.color)}>{cfg.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted mt-1.5">
                      <span>{ev.totalSlots} slots · {ev.slotsRemaining} left</span>
                      <span>{formatCurrency(ev.pricePerSlotNgn)}/slot</span>
                      <span>Collected: <strong className="text-ink">{formatCurrency(ev.amountCollectedNgn)}</strong></span>
                      <span>{ev.participantCount} participant{ev.participantCount !== 1 ? 's' : ''}</span>
                    </div>
                    {/* Fill bar */}
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* View participants */}
                    <button onClick={() => setViewingId(ev.id)} className="p-1.5 text-muted hover:text-ink hover:bg-surface rounded-lg" title="View participants">
                      <Eye size={15} />
                    </button>
                    {/* Edit (only OPEN) */}
                    {ev.status === 'OPEN' && (
                      <button onClick={() => openEdit(ev)} className="p-1.5 text-muted hover:text-ink hover:bg-surface rounded-lg" title="Edit">
                        <Pencil size={15} />
                      </button>
                    )}
                    {/* Fulfill (only CONFIRMED) */}
                    {ev.status === 'CONFIRMED' && (
                      <button onClick={() => handleFulfill(ev.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Mark fulfilled">
                        <Package size={15} />
                      </button>
                    )}
                    {/* Cancel */}
                    {!['CANCELLED', 'FULFILLED'].includes(ev.status) && (
                      <button onClick={() => setCancelConfirm({ id: ev.id, title: ev.title })} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Cancel event">
                        <Ban size={15} />
                      </button>
                    )}
                    {/* Expand */}
                    <button onClick={() => setExpandedId(isExpanded ? null : ev.id)} className="p-1.5 text-muted hover:text-ink hover:bg-surface rounded-lg">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded stats row */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100"
                  >
                    <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total slots', value: ev.totalSlots },
                        { label: 'Paid slots', value: ev.slotsPaid },
                        { label: 'Expected revenue', value: formatCurrency(ev.totalSlots * ev.pricePerSlotNgn) },
                        { label: 'Collected', value: formatCurrency(ev.amountCollectedNgn) },
                      ].map(s => (
                        <div key={s.label} className="bg-surface rounded-xl px-3 py-2.5">
                          <p className="text-[10px] text-muted uppercase font-bold">{s.label}</p>
                          <p className="text-sm font-black text-ink mt-0.5">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Participants modal */}
      <AnimatePresence>
        {viewingId && (
          <ParticipantsModal eventId={viewingId} onClose={() => setViewingId(null)} />
        )}
      </AnimatePresence>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {cancelConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setCancelConfirm(null)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <h3 className="font-black text-ink">Cancel this event?</h3>
              </div>
              <p className="text-sm text-muted mb-2">
                <strong>"{cancelConfirm.title}"</strong> will be cancelled.
              </p>
              <p className="text-sm text-muted mb-6">
                All paid participants will be marked for refund. All reserved slots will be released. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setCancelConfirm(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-muted hover:bg-surface">
                  Keep event
                </button>
                <button onClick={() => handleCancel(cancelConfirm.id)} disabled={cancelling === cancelConfirm.id}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                  {cancelling === cancelConfirm.id ? 'Cancelling…' : 'Yes, cancel it'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
