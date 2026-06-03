import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Building2, HardHat, ChevronDown, X,
  MapPin, Clock, Camera, User, Phone,
  CheckCircle2, Loader2, Search, Calendar,
  ClipboardList, Settings, AlertTriangle, Eye,
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CleaningRequest {
  id: string;
  requestNumber: string;
  category: 'HOME' | 'OFFICE' | 'CONSTRUCTION';
  serviceTypes: string[];
  propertyType: string | null;
  squareFootage: number | null;
  roomCount: number | null;
  floorCount: number | null;
  officeLayout: string | null;
  specialZones: string[];
  cleanersNeeded: number | null;
  janitorsNeeded: number | null;
  constructionType: string | null;
  constructionStage: string | null;
  siteAccessHours: string | null;
  heavyEquipmentOnSite: boolean;
  plotSize: string | null;
  isRecurring: boolean;
  recurringFreq: string | null;
  location: string;
  preferredDate: string;
  preferredTime: string | null;
  photoUrls: string[];
  specialRequest: string | null;
  status: string;
  assessmentType: 'REMOTE' | 'IN_PERSON';
  // Contact person
  contactPersonName: string | null;
  contactPersonPhone: string | null;
  contactPersonEmail: string | null;
  contactPersonRole: string | null;
  // Inspection
  inspectionScheduledAt: string | null;
  inspectionNote: string | null;
  crewSizeRecommended: number | null;
  inspectionCompletedAt: string | null;
  beforePhotoUrls: string[];
  afterPhotoUrls: string[];
  handoverNote: string | null;
  // Quote
  quoteAmountNgn: string | null;
  depositAmountNgn: string | null;
  quoteNotes: string | null;
  quotedAt: string | null;
  // Assignment
  assignedCleanerName: string | null;
  assignedCleanerPhone: string | null;
  depositPaidAt: string | null;
  createdAt: string;
  user: { fullName: string | null; phone: string; email: string | null };
}

interface HomePricing {
  propertyTypes: { key: string; label: string; baseClean: number; deepClean: number; moveInOut: number }[];
  addOns: { key: string; label: string; price: number }[];
}

const CAT_META: Record<string, { icon: React.FC<any>; gradient: string; label: string }> = {
  HOME:         { icon: Home,       gradient: 'from-emerald-500 to-teal-600',  label: 'Home'         },
  OFFICE:       { icon: Building2,  gradient: 'from-blue-500 to-indigo-600',   label: 'Office'       },
  CONSTRUCTION: { icon: HardHat,    gradient: 'from-orange-500 to-amber-600',  label: 'Construction' },
};

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING_QUOTE:         { label: 'Pending Quote',    color: 'text-amber-700 bg-amber-50'      },
  INSPECTION_SCHEDULED:  { label: 'Inspection Booked',color: 'text-violet-700 bg-violet-50'    },
  QUOTED:                { label: 'Quote Sent',       color: 'text-blue-700 bg-blue-50'        },
  DEPOSIT_PAID:          { label: 'Deposit Paid',     color: 'text-indigo-700 bg-indigo-50'    },
  ASSIGNED:              { label: 'Assigned',         color: 'text-purple-700 bg-purple-50'    },
  IN_PROGRESS:           { label: 'In Progress',      color: 'text-primary bg-primary/10'      },
  COMPLETED:             { label: 'Completed',        color: 'text-emerald-700 bg-emerald-50'  },
  CANCELLED:             { label: 'Cancelled',        color: 'text-red-700 bg-red-50'          },
};

const STATUS_OPTIONS = ['ALL', 'PENDING_QUOTE', 'INSPECTION_SCHEDULED', 'QUOTED', 'DEPOSIT_PAID', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const CATEGORY_OPTIONS = ['ALL', 'HOME', 'OFFICE', 'CONSTRUCTION'];

// ── Shared modal wrapper ──────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-ink text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface rounded-lg"><X size={16} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// ── Quote modal ───────────────────────────────────────────────────────────────

function QuoteModal({ request, onClose }: { request: CleaningRequest; onClose: () => void }) {
  const [quote, setQuote]     = useState(request.quoteAmountNgn ?? '');
  const [deposit, setDeposit] = useState(request.depositAmountNgn ?? '');
  const [notes, setNotes]     = useState(request.quoteNotes ?? '');
  const [saving, setSaving]   = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const handleSend = async () => {
    if (!quote || !deposit) { showToast('Enter both quote and deposit amounts', 'warning'); return; }
    setSaving(true);
    try {
      await axios.post(`/admin/cleaning/${request.id}/quote`, {
        quoteAmountNgn: Number(quote), depositAmountNgn: Number(deposit), quoteNotes: notes || undefined,
      });
      showToast('Quote sent to customer!', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-cleaning'] });
      onClose();
    } catch (err) {
      showToast(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to send quote', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`Send Quote — ${request.requestNumber}`} onClose={onClose}>
      {request.crewSizeRecommended && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2 mb-4 text-xs text-violet-700">
          <span className="font-bold">Inspection recommendation:</span> {request.crewSizeRecommended} crew members.
          {request.inspectionNote && <span> Note: {request.inspectionNote}</span>}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">Total quote amount (₦) *</label>
          <input type="number" min={1} value={quote} onChange={e => setQuote(e.target.value)} placeholder="e.g. 35000" className="input-base" />
        </div>
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">Deposit required (₦) *</label>
          <input type="number" min={1} value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="e.g. 10000" className="input-base" />
          {quote && deposit && Number(deposit) > 0 && (
            <p className="text-xs text-muted mt-1">Deposit is {Math.round((Number(deposit) / Number(quote)) * 100)}% of total</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">Notes for customer (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="e.g. Price includes materials. 3-hour service window."
            className="input-base resize-none" />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-muted">Cancel</button>
        <button onClick={handleSend} disabled={saving}
          className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {saving ? 'Sending…' : 'Send Quote'}
        </button>
      </div>
    </Modal>
  );
}

// ── Inspection modal ──────────────────────────────────────────────────────────

function InspectionModal({ request, onClose }: { request: CleaningRequest; onClose: () => void }) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [note, setNote]               = useState('');
  const [saving, setSaving]           = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const handleSchedule = async () => {
    if (!scheduledAt) { showToast('Select an inspection date and time', 'warning'); return; }
    setSaving(true);
    try {
      await axios.post(`/admin/cleaning/${request.id}/schedule-inspection`, {
        inspectionScheduledAt: new Date(scheduledAt).toISOString(),
        inspectionNote: note || undefined,
      });
      showToast('Inspection scheduled — customer notified', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-cleaning'] });
      onClose();
    } catch (err) {
      showToast(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to schedule inspection', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`Schedule Inspection — ${request.requestNumber}`} onClose={onClose}>
      {request.contactPersonName && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 mb-4 text-xs text-gray-700 space-y-0.5">
          <p className="font-bold text-muted uppercase tracking-wide">Contact on site</p>
          <p>{request.contactPersonName}{request.contactPersonRole && ` · ${request.contactPersonRole}`}</p>
          {request.contactPersonPhone && <p>{request.contactPersonPhone}</p>}
          {request.contactPersonEmail && <p>{request.contactPersonEmail}</p>}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">
            <Calendar size={11} className="inline mr-1" /> Inspection date & time *
          </label>
          <input type="datetime-local" value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="input-base" />
        </div>
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">Internal note (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder="e.g. Bring safety boots. Speak to facility manager."
            className="input-base resize-none" />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-muted">Cancel</button>
        <button onClick={handleSchedule} disabled={saving}
          className="flex-1 py-3 bg-violet-600 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
          {saving ? 'Scheduling…' : 'Schedule Inspection'}
        </button>
      </div>
    </Modal>
  );
}

// ── Inspection complete modal ─────────────────────────────────────────────────

function InspectionCompleteModal({ request, onClose }: { request: CleaningRequest; onClose: () => void }) {
  const [crew, setCrew]         = useState(request.crewSizeRecommended?.toString() ?? '');
  const [note, setNote]         = useState(request.inspectionNote ?? '');
  const [photos, setPhotos]     = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving]     = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 8);
    setPhotos(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (crew) formData.append('crewSizeRecommended', crew);
      if (note) formData.append('inspectionNote', note);
      photos.forEach(f => formData.append('beforePhotos', f));

      await axios.patch(`/admin/cleaning/${request.id}/complete-inspection`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Inspection findings recorded — you can now send a quote', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-cleaning'] });
      onClose();
    } catch (err) {
      showToast(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to record inspection', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`Record Inspection — ${request.requestNumber}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">Crew size recommended</label>
          <input type="number" min={1} value={crew} onChange={e => setCrew(e.target.value)}
            placeholder="e.g. 5 cleaners" className="input-base" />
        </div>
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">Inspection findings / notes</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4}
            placeholder="Describe site condition, access issues, special equipment needed, scope clarifications…"
            className="input-base resize-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">
            <Camera size={11} className="inline mr-1" /> Before photos (optional, max 8)
          </label>
          <input type="file" accept="image/*" multiple onChange={handlePhotoChange}
            className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold hover:file:bg-primary/20 cursor-pointer" />
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {previews.map((src, i) => (
                <img key={i} src={src} alt="" className="size-16 rounded-xl object-cover border border-gray-100" />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-muted">Cancel</button>
        <button onClick={handleComplete} disabled={saving}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <ClipboardList size={14} />}
          {saving ? 'Saving…' : 'Save Findings'}
        </button>
      </div>
    </Modal>
  );
}

// ── Assign modal ──────────────────────────────────────────────────────────────

function AssignModal({ request, onClose }: { request: CleaningRequest; onClose: () => void }) {
  const [name, setName]     = useState(request.assignedCleanerName ?? '');
  const [phone, setPhone]   = useState(request.assignedCleanerPhone ?? '');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const handleAssign = async () => {
    if (!name || !phone) { showToast('Enter cleaner name and phone', 'warning'); return; }
    setSaving(true);
    try {
      await axios.patch(`/admin/cleaning/${request.id}/assign`, {
        assignedCleanerName: name, assignedCleanerPhone: phone,
      });
      showToast('Cleaner assigned!', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-cleaning'] });
      onClose();
    } catch (err) {
      showToast(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to assign cleaner', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Assign Cleaner" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">
            <User size={11} className="inline mr-1" /> Cleaner name *
          </label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chinedu Okeke" className="input-base" />
        </div>
        <div>
          <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">
            <Phone size={11} className="inline mr-1" /> Phone number *
          </label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +234 803 111 2222" className="input-base" />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-bold text-muted">Cancel</button>
        <button onClick={handleAssign} disabled={saving}
          className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Assigning…' : 'Assign Cleaner'}
        </button>
      </div>
    </Modal>
  );
}

// ── Request row ───────────────────────────────────────────────────────────────

function RequestRow({ request }: { request: CleaningRequest }) {
  const [expanded, setExpanded]     = useState(false);
  const [showQuote, setShowQuote]   = useState(false);
  const [showInspect, setShowInspect]     = useState(false);
  const [showInspectDone, setShowInspectDone] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const meta      = CAT_META[request.category];
  const Icon      = meta.icon;
  const statusCfg = STATUS_CFG[request.status] ?? { label: request.status, color: 'text-gray-600 bg-gray-50' };

  const statusMutation = useMutation({
    mutationFn: (status: string) => axios.patch(`/admin/cleaning/${request.id}/status`, { status }),
    onSuccess: (_, status) => {
      showToast(`Status updated to ${status}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-cleaning'] });
    },
    onError: () => showToast('Failed to update status', 'error'),
  });

  const nextStatus: Record<string, string> = { ASSIGNED: 'IN_PROGRESS', IN_PROGRESS: 'COMPLETED' };
  const next = nextStatus[request.status];

  const needsInspection = ['OFFICE', 'CONSTRUCTION'].includes(request.category);

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className={cn('size-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shrink-0', meta.gradient)}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className="font-black text-ink text-sm">{request.requestNumber}</span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold', statusCfg.color)}>{statusCfg.label}</span>
                {request.assessmentType === 'IN_PERSON' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold text-violet-700 bg-violet-50">In-person</span>
                )}
              </div>
              <p className="text-xs text-muted">{meta.label} · {request.user.fullName ?? request.user.phone}</p>
            </div>
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 hover:bg-surface rounded-lg">
              <motion.div animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown size={14} className="text-muted" /></motion.div>
            </button>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted mb-3">
            <span className="flex items-center gap-1"><MapPin size={10} /> {request.location.slice(0, 50)}{request.location.length > 50 ? '…' : ''}</span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {new Date(request.preferredDate).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
              {request.preferredTime && ` · ${request.preferredTime}`}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Schedule inspection — OFFICE / CONSTRUCTION, still in PENDING_QUOTE */}
            {request.status === 'PENDING_QUOTE' && needsInspection && (
              <button onClick={() => setShowInspect(true)}
                className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors flex items-center gap-1">
                <Calendar size={11} /> Schedule Inspection
              </button>
            )}
            {/* Send quote directly — PENDING_QUOTE (HOME or small office) */}
            {request.status === 'PENDING_QUOTE' && !needsInspection && (
              <button onClick={() => setShowQuote(true)}
                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors">
                Send Quote
              </button>
            )}
            {/* Record inspection findings */}
            {request.status === 'INSPECTION_SCHEDULED' && (
              <>
                <button onClick={() => setShowInspectDone(true)}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1">
                  <ClipboardList size={11} /> Record Findings
                </button>
                {request.inspectionCompletedAt && (
                  <button onClick={() => setShowQuote(true)}
                    className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors">
                    Send Quote
                  </button>
                )}
              </>
            )}
            {/* Update quote */}
            {request.status === 'QUOTED' && (
              <button onClick={() => setShowQuote(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
                Update Quote
              </button>
            )}
            {/* Assign cleaner */}
            {request.status === 'DEPOSIT_PAID' && (
              <button onClick={() => setShowAssign(true)}
                className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors">
                Assign Cleaner
              </button>
            )}
            {/* Progress status */}
            {next && (
              <button onClick={() => statusMutation.mutate(next)} disabled={statusMutation.isPending}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                {statusMutation.isPending && <Loader2 size={10} className="animate-spin" />}
                Mark as {next === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
              </button>
            )}
            {!['COMPLETED', 'CANCELLED'].includes(request.status) && (
              <button onClick={() => statusMutation.mutate('CANCELLED')} disabled={statusMutation.isPending}
                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors">
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
              <div className="p-4 space-y-4 text-sm">
                {/* Customer */}
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Customer</p>
                  <p className="text-ink">{request.user.fullName ?? '—'}</p>
                  <p className="text-muted text-xs">{request.user.phone} {request.user.email && `· ${request.user.email}`}</p>
                </div>

                {/* Contact person */}
                {request.contactPersonName && (
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">On-site contact</p>
                    <p className="text-ink text-xs font-semibold">{request.contactPersonName}{request.contactPersonRole && ` · ${request.contactPersonRole}`}</p>
                    {request.contactPersonPhone && <p className="text-muted text-xs">{request.contactPersonPhone}</p>}
                    {request.contactPersonEmail && <p className="text-muted text-xs">{request.contactPersonEmail}</p>}
                  </div>
                )}

                {/* Services */}
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.serviceTypes.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-xl">{s}</span>
                    ))}
                  </div>
                </div>

                {/* Property details */}
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Property</p>
                  <div className="text-xs text-muted space-y-0.5">
                    {request.propertyType && <p>Type: {request.propertyType}</p>}
                    {request.squareFootage && <p>Area: {request.squareFootage} sq ft</p>}
                    {request.floorCount && <p>Floors: {request.floorCount}</p>}
                    {request.officeLayout && <p>Layout: {request.officeLayout}</p>}
                    {request.specialZones?.length > 0 && <p>Zones: {request.specialZones.join(', ')}</p>}
                    {(request.cleanersNeeded || request.janitorsNeeded) && (
                      <p>Staff requested: {[request.cleanersNeeded && `${request.cleanersNeeded} cleaners`, request.janitorsNeeded && `${request.janitorsNeeded} janitors`].filter(Boolean).join(', ')}</p>
                    )}
                    {request.constructionType && <p>Build type: {request.constructionType}</p>}
                    {request.constructionStage && <p>Stage: {request.constructionStage}</p>}
                    {request.plotSize && <p>Plot size: {request.plotSize}</p>}
                    {request.siteAccessHours && <p>Access hours: {request.siteAccessHours}</p>}
                    {request.heavyEquipmentOnSite && <p className="text-amber-700">⚠️ Heavy equipment on site</p>}
                    {request.isRecurring && request.recurringFreq && <p>Recurring: {request.recurringFreq}</p>}
                  </div>
                </div>

                {/* Special request */}
                {request.specialRequest && (
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Special request</p>
                    <p className="text-muted text-xs">{request.specialRequest}</p>
                  </div>
                )}

                {/* Customer photos */}
                {request.photoUrls.length > 0 && (
                  <PhotoGallery urls={request.photoUrls} label="Customer photos" />
                )}

                {/* Inspection info */}
                {request.inspectionScheduledAt && (
                  <div className="bg-violet-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-bold text-violet-700 mb-1">Inspection</p>
                    <p className="text-xs text-violet-700">
                      Scheduled: {new Date(request.inspectionScheduledAt).toLocaleString('en-NG')}
                    </p>
                    {request.inspectionCompletedAt && (
                      <p className="text-xs text-violet-700 mt-0.5">Completed: {new Date(request.inspectionCompletedAt).toLocaleString('en-NG')}</p>
                    )}
                    {request.crewSizeRecommended && (
                      <p className="text-xs text-violet-700 mt-0.5">Recommended crew: {request.crewSizeRecommended}</p>
                    )}
                    {request.inspectionNote && (
                      <p className="text-xs text-violet-700 mt-1 italic">"{request.inspectionNote}"</p>
                    )}
                  </div>
                )}

                {/* Before photos */}
                {request.beforePhotoUrls?.length > 0 && (
                  <PhotoGallery urls={request.beforePhotoUrls} label="Before photos" />
                )}

                {/* Quote info */}
                {request.quoteAmountNgn && (
                  <div className="bg-blue-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-bold text-blue-700 mb-1">Quote</p>
                    <p className="text-xs text-blue-700">
                      Total: {formatCurrency(Number(request.quoteAmountNgn))} · Deposit: {formatCurrency(Number(request.depositAmountNgn))}
                    </p>
                    {request.quoteNotes && <p className="text-xs text-blue-700 mt-0.5 italic">"{request.quoteNotes}"</p>}
                    {request.depositPaidAt && (
                      <p className="text-xs text-emerald-700 mt-1">✅ Deposit paid {new Date(request.depositPaidAt).toLocaleDateString('en-NG')}</p>
                    )}
                  </div>
                )}

                {/* Assigned cleaner */}
                {request.assignedCleanerName && (
                  <div className="bg-purple-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-bold text-purple-700 mb-0.5">Assigned cleaner</p>
                    <p className="text-xs text-purple-700">{request.assignedCleanerName} · {request.assignedCleanerPhone}</p>
                  </div>
                )}

                {/* After photos + handover note */}
                {request.afterPhotoUrls?.length > 0 && (
                  <PhotoGallery urls={request.afterPhotoUrls} label="After photos" />
                )}
                {request.handoverNote && (
                  <div>
                    <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Handover note</p>
                    <p className="text-xs text-muted">{request.handoverNote}</p>
                  </div>
                )}

                <p className="text-[11px] text-muted/60">Submitted {new Date(request.createdAt).toLocaleString('en-NG')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showQuote       && <QuoteModal            request={request} onClose={() => setShowQuote(false)}       />}
        {showInspect     && <InspectionModal        request={request} onClose={() => setShowInspect(false)}     />}
        {showInspectDone && <InspectionCompleteModal request={request} onClose={() => setShowInspectDone(false)} />}
        {showAssign      && <AssignModal            request={request} onClose={() => setShowAssign(false)}      />}
      </AnimatePresence>
    </>
  );
}

// ── Photo gallery helper ──────────────────────────────────────────────────────

function PhotoGallery({ urls, label }: { urls: string[]; label: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">
        <Camera size={10} className="inline mr-1" /> {label} ({urls.length})
      </p>
      <div className="flex gap-2 flex-wrap">
        {urls.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
            <img src={url} alt="" className="size-20 object-cover rounded-xl hover:opacity-90 transition-opacity border border-gray-100" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ── HOME Pricing Editor ───────────────────────────────────────────────────────

function HomePricingEditor() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: pricing, isLoading } = useQuery<HomePricing>({
    queryKey: ['admin-cleaning-pricing'],
    queryFn: async () => {
      const { data } = await axios.get('/admin/cleaning/pricing');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const [draft, setDraft] = useState<HomePricing | null>(null);
  const [saving, setSaving] = useState(false);

  const current = draft ?? pricing ?? { propertyTypes: [], addOns: [] };

  const updatePropertyType = (i: number, field: string, val: number) => {
    const updated = { ...current, propertyTypes: current.propertyTypes.map((pt, idx) => idx === i ? { ...pt, [field]: val } : pt) };
    setDraft(updated);
  };

  const updateAddOn = (i: number, val: number) => {
    const updated = { ...current, addOns: current.addOns.map((a, idx) => idx === i ? { ...a, price: val } : a) };
    setDraft(updated);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await axios.put('/admin/cleaning/pricing', draft);
      showToast('HOME pricing updated!', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-cleaning-pricing'] });
      setDraft(null);
    } catch (err) {
      showToast('Failed to save pricing', 'error');
    } finally { setSaving(false); }
  };

  if (isLoading) return <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-ink">HOME Cleaning Prices</h3>
          <p className="text-xs text-muted mt-0.5">Prices shown to customers as guidance. All values in ₦.</p>
        </div>
        <button onClick={save} disabled={!draft || saving}
          className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-40 flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save Changes
        </button>
      </div>

      {/* Property types */}
      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Property types</p>
        <div className="space-y-3">
          {current.propertyTypes.map((pt, i) => (
            <div key={pt.key} className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="font-bold text-ink text-sm mb-3">{pt.label}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { field: 'baseClean', label: 'Basic clean' },
                  { field: 'deepClean', label: 'Deep clean' },
                  { field: 'moveInOut', label: 'Move-in/out' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1">{label}</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">₦</span>
                      <input
                        type="number" min={0}
                        value={(pt as any)[field]}
                        onChange={e => updatePropertyType(i, field, Number(e.target.value))}
                        className="input-base pl-6 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Add-on prices</p>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
          {current.addOns.map((addOn, i) => (
            <div key={addOn.key} className="flex items-center gap-4">
              <span className="flex-1 text-sm text-ink">{addOn.label}</span>
              <div className="relative w-32">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">₦</span>
                <input
                  type="number" min={0}
                  value={addOn.price}
                  onChange={e => updateAddOn(i, Number(e.target.value))}
                  className="input-base pl-6 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

type AdminCleaningView = 'requests' | 'pricing';

export default function AdminCleaningTab() {
  const [view, setView]               = useState<AdminCleaningView>('requests');
  const [statusFilter,   setStatusFilter]   = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch]           = useState('');

  const { data, isLoading } = useQuery<{ data: CleaningRequest[]; total: number }>({
    queryKey: ['admin-cleaning', statusFilter, categoryFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter   !== 'ALL') params.status   = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      const { data } = await axios.get('/admin/cleaning', { params });
      return data;
    },
    staleTime: 30 * 1000,
  });

  const requests = (data?.data ?? []).filter(r =>
    !search ||
    r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
    (r.user.fullName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    r.location.toLowerCase().includes(search.toLowerCase())
  );

  const all = data?.data ?? [];
  const stats = {
    pending:     all.filter(r => r.status === 'PENDING_QUOTE').length,
    inspection:  all.filter(r => r.status === 'INSPECTION_SCHEDULED').length,
    active:      all.filter(r => ['DEPOSIT_PAID', 'ASSIGNED', 'IN_PROGRESS'].includes(r.status)).length,
    done:        all.filter(r => r.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="flex gap-2">
        {[
          { key: 'requests', label: 'Requests', icon: <ClipboardList size={14} /> },
          { key: 'pricing',  label: 'HOME Pricing', icon: <Settings size={14} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key as AdminCleaningView)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors',
              view === tab.key ? 'bg-primary text-white' : 'bg-surface text-muted hover:bg-gray-200'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {view === 'pricing' ? <HomePricingEditor /> : (<>
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Awaiting Quote',   value: stats.pending,    color: 'text-amber-700 bg-amber-50'      },
            { label: 'Inspection Set',   value: stats.inspection, color: 'text-violet-700 bg-violet-50'    },
            { label: 'Active Jobs',      value: stats.active,     color: 'text-primary bg-primary/10'      },
            { label: 'Completed',        value: stats.done,       color: 'text-emerald-700 bg-emerald-50'  },
          ].map(s => (
            <div key={s.label} className={cn('rounded-2xl px-4 py-3 text-center', s.color)}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Alert: pending inspections */}
        {stats.inspection > 0 && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm">
            <AlertTriangle size={16} className="text-violet-600 shrink-0" />
            <p className="text-violet-700"><span className="font-bold">{stats.inspection} inspection{stats.inspection > 1 ? 's' : ''}</span> scheduled — record findings and send quotes after the visit.</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by number, customer, location…" className="input-base pl-8" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base sm:w-52">
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : STATUS_CFG[s]?.label ?? s}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-base sm:w-40">
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>{c === 'ALL' ? 'All categories' : c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-muted text-sm">
            <Eye size={32} className="mx-auto mb-3 text-gray-200" />
            No cleaning requests found
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(r => <RequestRow key={r.id} request={r} />)}
          </div>
        )}
      </>)}
    </div>
  );
}
