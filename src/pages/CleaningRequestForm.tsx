import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Building2, HardHat, CheckCircle2, ChevronLeft,
  ChevronRight, Upload, X, MapPin, Calendar, Clock,
  FileText, Loader2, User, Phone, Mail, Briefcase,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// ── Service catalogue ─────────────────────────────────────────────────────────

type Category = 'HOME' | 'OFFICE' | 'CONSTRUCTION';

const SERVICES: Record<Category, { label: string; addOn?: boolean }[]> = {
  HOME: [
    { label: 'Basic cleaning' },
    { label: 'Deep cleaning' },
    { label: 'Move-in / move-out cleaning' },
    { label: 'Laundry & ironing', addOn: true },
    { label: 'Kitchen deep clean', addOn: true },
    { label: 'Bathroom sanitization', addOn: true },
    { label: 'Window washing', addOn: true },
    { label: 'Carpet / rug cleaning', addOn: true },
  ],
  OFFICE: [
    { label: 'One-time deep clean' },
    { label: 'Daily subscription' },
    { label: 'Weekly subscription' },
    { label: 'Janitorial support' },
    { label: 'Restroom maintenance' },
    { label: 'Carpet cleaning', addOn: true },
    { label: 'Workspace disinfection', addOn: true },
    { label: 'Window & glass cleaning', addOn: true },
  ],
  CONSTRUCTION: [
    { label: 'Post-construction debris removal' },
    { label: 'Industrial dust removal' },
    { label: 'Window & glass cleaning' },
    { label: 'Floor scrubbing & polishing' },
    { label: 'Final finishing cleanup' },
    { label: 'Before-occupancy deep clean' },
    { label: 'Hazardous waste removal', addOn: true },
  ],
};

const HOME_SIZES = [
  { key: 'self-contained', label: 'Self-Contained / Studio' },
  { key: '1-bed',          label: '1-Bedroom Flat' },
  { key: '2-bed',          label: '2-Bedroom Flat' },
  { key: '3-bed',          label: '3-Bedroom Flat' },
  { key: 'duplex',         label: 'Duplex / Maisonette' },
  { key: 'shortlet',       label: 'Shortlet / Serviced Apt' },
];

const OFFICE_LAYOUTS = ['Open-plan', 'Cubicles / Partitioned', 'Mixed layout', 'Executive suites', 'Co-working space'];
const SPECIAL_ZONES = ['Server room', 'Boardroom', 'Reception', 'Kitchen/Pantry', 'Restrooms', 'Storage room', 'Outdoor area'];
const CONSTRUCTION_TYPES = ['Residential', 'Commercial', 'Industrial', 'Mixed-use'];
const CONSTRUCTION_STAGES = ['Post-foundation', 'Structural works done', 'Finishing phase', 'Pre-handover', 'Handover cleanup'];

const CATEGORY_META: Record<Category, { icon: React.FC<any>; label: string; color: string; gradient: string }> = {
  HOME:         { icon: Home,        label: 'Home Cleaning',               color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600'   },
  OFFICE:       { icon: Building2,   label: 'Office Cleaning',             color: 'text-blue-600',    gradient: 'from-blue-500 to-indigo-600'    },
  CONSTRUCTION: { icon: HardHat,     label: 'Construction Site Cleaning',  color: 'text-orange-600',  gradient: 'from-orange-500 to-amber-600'   },
};

const TIMES = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const STEPS = ['Category', 'Services', 'Details', 'Photos & Notes', 'Review'];

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  category:       Category;
  serviceTypes:   string[];

  // HOME
  propertyType:   string;

  // OFFICE / CONSTRUCTION shared
  squareFootage:  string;
  roomCount:      string;
  isRecurring:    boolean;
  recurringFreq:  'daily' | 'weekly' | '';

  // Contact person (OFFICE / CONSTRUCTION)
  contactPersonName:  string;
  contactPersonPhone: string;
  contactPersonEmail: string;
  contactPersonRole:  string;

  // Office-specific
  floorCount:     string;
  officeLayout:   string;
  specialZones:   string[];
  cleanersNeeded: string;
  janitorsNeeded: string;

  // Construction-specific
  constructionType:     string;
  constructionStage:    string;
  siteAccessHours:      string;
  heavyEquipmentOnSite: boolean;
  plotSize:             string;

  // Common
  location:       string;
  preferredDate:  string;
  preferredTime:  string;
  specialRequest: string;
}

const defaultForm = (cat?: Category): FormState => ({
  category:       cat ?? 'HOME',
  serviceTypes:   [],
  propertyType:   '',
  squareFootage:  '',
  roomCount:      '',
  isRecurring:    false,
  recurringFreq:  '',
  contactPersonName:  '',
  contactPersonPhone: '',
  contactPersonEmail: '',
  contactPersonRole:  '',
  floorCount:     '',
  officeLayout:   '',
  specialZones:   [],
  cleanersNeeded: '',
  janitorsNeeded: '',
  constructionType:     '',
  constructionStage:    '',
  siteAccessHours:      '',
  heavyEquipmentOnSite: false,
  plotSize:             '',
  location:       '',
  preferredDate:  '',
  preferredTime:  '',
  specialRequest: '',
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function CleaningRequestForm() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const { user }      = useAuth();
  const { showToast } = useToast();

  const passedCat   = (location.state as any)?.category as Category | undefined;
  const [step, setStep]           = useState(passedCat ? 1 : 0);
  const [form, setForm]           = useState<FormState>(defaultForm(passedCat));
  const [photos, setPhotos]       = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) {
    navigate('/login', { state: { from: '/cleaning/book' } });
    return null;
  }

  const meta = CATEGORY_META[form.category];
  const Icon = meta.icon;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggleService = (label: string) => {
    setForm(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(label)
        ? prev.serviceTypes.filter(s => s !== label)
        : [...prev.serviceTypes, label],
    }));
  };

  const toggleZone = (zone: string) => {
    setForm(prev => ({
      ...prev,
      specialZones: prev.specialZones.includes(zone)
        ? prev.specialZones.filter(z => z !== zone)
        : [...prev.specialZones, zone],
    }));
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).slice(0, 5 - photos.length);
    setPhotos(prev => [...prev, ...incoming]);
    incoming.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Validation ────────────────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    if (step === 0) return true;
    if (step === 1) return form.serviceTypes.length > 0;
    if (step === 2) {
      if (!form.location || !form.preferredDate) return false;
      if (form.category === 'HOME' && !form.propertyType) return false;
      // Recurring frequency required when recurring toggle is on (OFFICE)
      if (form.category === 'OFFICE' && form.isRecurring && !form.recurringFreq) return false;
      // Contact person required for CONSTRUCTION
      if (form.category === 'CONSTRUCTION') {
        if (!form.contactPersonName || !form.contactPersonPhone) return false;
      }
      return true;
    }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('category',     form.category);
      form.serviceTypes.forEach(s => fd.append('serviceTypes', s));
      if (form.propertyType)  fd.append('propertyType',  form.propertyType);
      if (form.squareFootage) fd.append('squareFootage', form.squareFootage);
      if (form.roomCount)     fd.append('roomCount',     form.roomCount);
      fd.append('isRecurring',  String(form.isRecurring));
      if (form.recurringFreq) fd.append('recurringFreq', form.recurringFreq);

      // Contact person
      if (form.contactPersonName)  fd.append('contactPersonName',  form.contactPersonName);
      if (form.contactPersonPhone) fd.append('contactPersonPhone', form.contactPersonPhone);
      if (form.contactPersonEmail) fd.append('contactPersonEmail', form.contactPersonEmail);
      if (form.contactPersonRole)  fd.append('contactPersonRole',  form.contactPersonRole);

      // Office fields
      if (form.floorCount)     fd.append('floorCount',     form.floorCount);
      if (form.officeLayout)   fd.append('officeLayout',   form.officeLayout);
      form.specialZones.forEach(z => fd.append('specialZones', z));
      if (form.cleanersNeeded) fd.append('cleanersNeeded', form.cleanersNeeded);
      if (form.janitorsNeeded) fd.append('janitorsNeeded', form.janitorsNeeded);

      // Construction fields
      if (form.constructionType)  fd.append('constructionType',  form.constructionType);
      if (form.constructionStage) fd.append('constructionStage', form.constructionStage);
      if (form.siteAccessHours)   fd.append('siteAccessHours',   form.siteAccessHours);
      fd.append('heavyEquipmentOnSite', String(form.heavyEquipmentOnSite));
      if (form.plotSize)          fd.append('plotSize',          form.plotSize);

      fd.append('location',      form.location);
      fd.append('preferredDate', new Date(form.preferredDate).toISOString());
      if (form.preferredTime)  fd.append('preferredTime',  form.preferredTime);
      if (form.specialRequest) fd.append('specialRequest', form.specialRequest);
      photos.forEach(p => fd.append('photos', p));

      await axios.post('/cleaning', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSubmitted(true);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      showToast(msg ?? 'Submission failed — please try again', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
          <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-2xl font-black text-ink mb-2">Request submitted!</h2>
        <p className="text-muted mb-6">
          {form.category === 'CONSTRUCTION'
            ? "Our team will contact you to schedule an on-site inspection. You'll receive a detailed quote within 24 hours of the inspection."
            : form.category === 'OFFICE' && form.squareFootage && parseInt(form.squareFootage) > 500
            ? "For your office size, we'll schedule an on-site inspection first. You'll receive a quote within 24 hours of the visit."
            : "Our team is reviewing your request. You'll receive a personalised quote within 24 hours via in-app notification and email."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/orders', { state: { tab: 'cleaning' } })}
            className="px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-colors"
          >
            Track my request
          </button>
          <button
            onClick={() => navigate('/cleaning')}
            className="px-6 py-3 border border-gray-200 text-muted font-bold rounded-2xl hover:bg-surface transition-colors"
          >
            Back to Cleaning
          </button>
        </div>
      </div>
    );
  }

  // ── Input helper ──────────────────────────────────────────────────────────────

  const InputField = ({
    label, icon: LabelIcon, required, children, hint
  }: { label: string; icon?: React.FC<any>; required?: boolean; children: React.ReactNode; hint?: string }) => (
    <div>
      <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">
        {LabelIcon && <LabelIcon size={11} className="inline mr-1" />}
        {label} {required && <span className="text-red-500">*</span>}
        {hint && <span className="normal-case text-muted font-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );

  // ── Step renderer ─────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {

      // ── Step 0: Category selection ─────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-ink mb-4">What are we cleaning?</h2>
            {(['HOME', 'OFFICE', 'CONSTRUCTION'] as Category[]).map(cat => {
              const m = CATEGORY_META[cat];
              const CatIcon = m.icon;
              return (
                <button
                  key={cat}
                  onClick={() => { set('category', cat); set('serviceTypes', []); setStep(1); }}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                    form.category === cat ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200 bg-white'
                  )}
                >
                  <div className={cn('size-12 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shrink-0', m.gradient)}>
                    <CatIcon size={22} />
                  </div>
                  <div>
                    <p className="font-black text-ink text-sm">{m.label}</p>
                    <p className="text-xs text-muted">{
                      cat === 'HOME'         ? 'Apartments, duplexes, shortlets & homes' :
                      cat === 'OFFICE'       ? 'SMEs, coworking spaces, schools & corporates' :
                                               'Post-build debris removal & finishing cleanup'
                    }</p>
                  </div>
                  <ChevronRight size={18} className="ml-auto text-muted shrink-0" />
                </button>
              );
            })}
          </div>
        );

      // ── Step 1: Services ───────────────────────────────────────────────────
      case 1: {
        const services = SERVICES[form.category];
        const core    = services.filter(s => !s.addOn);
        const addOns  = services.filter(s => s.addOn);
        return (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className={cn('size-10 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shrink-0', meta.gradient)}>
                <Icon size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black text-ink">{meta.label}</h2>
                <p className="text-xs text-muted">Select all services you need</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Main services</p>
                <div className="space-y-2">
                  {core.map(({ label }) => (
                    <ServiceToggle key={label} label={label} selected={form.serviceTypes.includes(label)} onToggle={() => toggleService(label)} />
                  ))}
                </div>
              </div>

              {addOns.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Add-ons (optional)</p>
                  <div className="space-y-2">
                    {addOns.map(({ label }) => (
                      <ServiceToggle key={label} label={label} selected={form.serviceTypes.includes(label)} onToggle={() => toggleService(label)} isAddOn />
                    ))}
                  </div>
                </div>
              )}

              {/* Recurring for Office */}
              {form.category === 'OFFICE' && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-ink">Recurring subscription?</p>
                    <button
                      onClick={() => set('isRecurring', !form.isRecurring)}
                      aria-label={form.isRecurring ? 'Disable recurring subscription' : 'Enable recurring subscription'}
                      className={cn('relative w-10 h-5 rounded-full transition-colors', form.isRecurring ? 'bg-primary' : 'bg-gray-200')}
                    >
                      <span className={cn('absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform shadow-sm', form.isRecurring && 'translate-x-5')} />
                    </button>
                  </div>
                  {form.isRecurring && (
                    <div className="flex gap-2">
                      {(['daily', 'weekly'] as const).map(freq => (
                        <button
                          key={freq}
                          onClick={() => set('recurringFreq', freq)}
                          className={cn('flex-1 py-2 rounded-xl text-sm font-bold transition-colors', form.recurringFreq === freq ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-muted')}
                        >
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      // ── Step 2: Details ────────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-black text-ink">Property details</h2>

            {/* ── HOME: property size ── */}
            {form.category === 'HOME' && (
              <InputField label="Property size" required>
                <div className="grid grid-cols-2 gap-2">
                  {HOME_SIZES.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => set('propertyType', key)}
                      className={cn(
                        'py-3 px-4 rounded-xl text-sm font-semibold border transition-colors text-left',
                        form.propertyType === key ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-100 bg-white text-ink hover:border-gray-200'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </InputField>
            )}

            {/* ── OFFICE / CONSTRUCTION: square footage ── */}
            {(form.category === 'OFFICE' || form.category === 'CONSTRUCTION') && (
              <InputField label="Estimated area" hint="optional — helps with quoting">
                <input
                  type="number" min={1} value={form.squareFootage}
                  onChange={e => set('squareFootage', e.target.value)}
                  placeholder="e.g. 1500 sq ft"
                  className="input-base"
                />
              </InputField>
            )}

            {/* ── OFFICE: office-specific fields ── */}
            {form.category === 'OFFICE' && (<>
              <InputField label="Number of floors" hint="optional">
                <input
                  type="number" min={1} value={form.floorCount}
                  onChange={e => set('floorCount', e.target.value)}
                  placeholder="e.g. 3"
                  className="input-base"
                />
              </InputField>

              <InputField label="Office layout" hint="optional">
                <div className="grid grid-cols-2 gap-2">
                  {OFFICE_LAYOUTS.map(layout => (
                    <button
                      key={layout}
                      onClick={() => set('officeLayout', form.officeLayout === layout ? '' : layout)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-xs font-semibold border text-left transition-colors',
                        form.officeLayout === layout ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-100 bg-white text-ink hover:border-gray-200'
                      )}
                    >
                      {layout}
                    </button>
                  ))}
                </div>
              </InputField>

              <InputField label="Special zones to clean" hint="select all that apply">
                <div className="flex flex-wrap gap-2">
                  {SPECIAL_ZONES.map(zone => (
                    <button
                      key={zone}
                      onClick={() => toggleZone(zone)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors',
                        form.specialZones.includes(zone) ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-100 bg-white text-ink hover:border-gray-200'
                      )}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </InputField>

              <div className="grid grid-cols-2 gap-3">
                <InputField label="Cleaners needed" hint="est.">
                  <input type="number" min={1} value={form.cleanersNeeded}
                    onChange={e => set('cleanersNeeded', e.target.value)}
                    placeholder="e.g. 3" className="input-base" />
                </InputField>
                <InputField label="Janitors needed" hint="est.">
                  <input type="number" min={1} value={form.janitorsNeeded}
                    onChange={e => set('janitorsNeeded', e.target.value)}
                    placeholder="e.g. 1" className="input-base" />
                </InputField>
              </div>
            </>)}

            {/* ── CONSTRUCTION: construction-specific fields ── */}
            {form.category === 'CONSTRUCTION' && (<>
              <InputField label="Construction type" hint="optional">
                <div className="grid grid-cols-2 gap-2">
                  {CONSTRUCTION_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => set('constructionType', form.constructionType === type ? '' : type)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-xs font-semibold border text-left transition-colors',
                        form.constructionType === type ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-100 bg-white text-ink hover:border-gray-200'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </InputField>

              <InputField label="Construction stage" hint="optional">
                <div className="grid grid-cols-2 gap-2">
                  {CONSTRUCTION_STAGES.map(stage => (
                    <button
                      key={stage}
                      onClick={() => set('constructionStage', form.constructionStage === stage ? '' : stage)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-xs font-semibold border text-left transition-colors',
                        form.constructionStage === stage ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-100 bg-white text-ink hover:border-gray-200'
                      )}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </InputField>

              <div className="grid grid-cols-2 gap-3">
                <InputField label="Plot / floor area" hint="optional">
                  <input value={form.plotSize}
                    onChange={e => set('plotSize', e.target.value)}
                    placeholder="e.g. 500 sqm" className="input-base" />
                </InputField>
                <InputField label="Site access hours" hint="optional">
                  <input value={form.siteAccessHours}
                    onChange={e => set('siteAccessHours', e.target.value)}
                    placeholder="e.g. 07:00–18:00" className="input-base" />
                </InputField>
              </div>

              {/* Heavy equipment toggle */}
              <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-ink">Heavy equipment on site?</p>
                  <p className="text-xs text-muted">Cranes, forklifts, excavators etc.</p>
                </div>
                <button
                  onClick={() => set('heavyEquipmentOnSite', !form.heavyEquipmentOnSite)}
                  aria-label={form.heavyEquipmentOnSite ? 'Heavy equipment present — click to disable' : 'Heavy equipment not present — click to enable'}
                  className={cn('relative w-10 h-5 rounded-full transition-colors shrink-0', form.heavyEquipmentOnSite ? 'bg-orange-500' : 'bg-gray-200')}
                >
                  <span className={cn('absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform shadow-sm', form.heavyEquipmentOnSite && 'translate-x-5')} />
                </button>
              </div>
            </>)}

            {/* ── Contact person (OFFICE / CONSTRUCTION) ── */}
            {(form.category === 'OFFICE' || form.category === 'CONSTRUCTION') && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted" />
                  <p className="text-sm font-bold text-ink">
                    Contact person on site
                    {form.category === 'CONSTRUCTION' && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {form.category === 'OFFICE' && <span className="text-xs text-muted font-normal">(recommended)</span>}
                </div>
                {form.category === 'CONSTRUCTION' && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <AlertCircle size={11} className="inline mr-1" />
                    Required — our inspector will need to coordinate with this person on-site.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1">Full name {form.category === 'CONSTRUCTION' && '*'}</label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input value={form.contactPersonName}
                        onChange={e => set('contactPersonName', e.target.value)}
                        placeholder="e.g. Emeka Okafor" className="input-base pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1">Phone number {form.category === 'CONSTRUCTION' && '*'}</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input value={form.contactPersonPhone} type="tel"
                        onChange={e => set('contactPersonPhone', e.target.value)}
                        placeholder="e.g. 0812 345 6789" className="input-base pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1">Email</label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input value={form.contactPersonEmail} type="email"
                        onChange={e => set('contactPersonEmail', e.target.value)}
                        placeholder="e.g. manager@company.com" className="input-base pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wide mb-1">Role / title</label>
                    <div className="relative">
                      <Briefcase size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input value={form.contactPersonRole}
                        onChange={e => set('contactPersonRole', e.target.value)}
                        placeholder="e.g. Facility Manager" className="input-base pl-8" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Inspection info banner ── */}
            {form.category === 'CONSTRUCTION' && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm">
                <p className="font-bold text-blue-800 mb-0.5">🔍 On-site inspection required</p>
                <p className="text-xs text-blue-700">For construction sites, our team will schedule an on-site inspection to assess the scope of work before sending you a quote. This usually takes 1–2 business days.</p>
              </div>
            )}
            {form.category === 'OFFICE' && form.squareFootage && parseInt(form.squareFootage) > 500 && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm">
                <p className="font-bold text-blue-800 mb-0.5">🔍 We may schedule an inspection</p>
                <p className="text-xs text-blue-700">For larger office spaces, our team may visit on-site before sending a quote. We'll let you know after reviewing your request.</p>
              </div>
            )}

            {/* ── Location ── */}
            <InputField label="Full address / location" icon={MapPin} required>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="e.g. 12 Admiralty Way, Lekki Phase 1, Lagos"
                className="input-base"
              />
            </InputField>

            {/* ── Preferred date ── */}
            <InputField label="Preferred date" icon={Calendar} required>
              <input
                type="date"
                value={form.preferredDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => set('preferredDate', e.target.value)}
                className="input-base"
              />
            </InputField>

            {/* ── Preferred time ── */}
            <InputField label="Preferred time" icon={Clock} hint="optional">
              <div className="grid grid-cols-4 gap-2">
                {TIMES.map(t => (
                  <button
                    key={t}
                    onClick={() => set('preferredTime', form.preferredTime === t ? '' : t)}
                    className={cn(
                      'py-2 rounded-xl text-xs font-semibold border transition-colors',
                      form.preferredTime === t ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-100 bg-white text-ink hover:border-gray-200'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </InputField>
          </div>
        );

      // ── Step 3: Photos & Notes ─────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-black text-ink">Photos & special requests</h2>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">
                <Upload size={11} className="inline mr-1" /> Photos of your property
                <span className="normal-case text-muted font-normal ml-1">— optional, helps us price accurately</span>
              </label>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => addPhotos(e.target.files)} />
              <div
                onClick={() => photos.length < 5 && fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-6 text-center transition-colors',
                  photos.length < 5 ? 'border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer' : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                )}
              >
                <Upload size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted font-semibold">
                  {photos.length < 5 ? 'Click to upload photos' : 'Maximum 5 photos reached'}
                </p>
                <p className="text-xs text-muted/60 mt-1">JPG, PNG or WebP · max 8 MB each · up to 5 photos</p>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt="" className="w-full h-24 object-cover rounded-2xl" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wide mb-2">
                <FileText size={11} className="inline mr-1" /> Special requests
                <span className="normal-case text-muted font-normal ml-1">— optional</span>
              </label>
              <textarea
                value={form.specialRequest}
                onChange={e => set('specialRequest', e.target.value)}
                rows={4} maxLength={1000}
                placeholder="Any specific areas to focus on, pets at home, access instructions, allergies to cleaning products, etc."
                className="input-base resize-none"
              />
              <p className="text-[11px] text-muted/60 mt-1 text-right">{form.specialRequest.length}/1000</p>
            </div>
          </div>
        );

      // ── Step 4: Review ─────────────────────────────────────────────────────
      case 4: {
        const m2 = CATEGORY_META[form.category];
        const ReviewIcon = m2.icon;
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-black text-ink">Review your request</h2>

            <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn('size-10 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shrink-0', m2.gradient)}>
                  <ReviewIcon size={18} />
                </div>
                <div>
                  <p className="font-black text-ink text-sm">{m2.label}</p>
                  {form.propertyType && <p className="text-xs text-muted">{HOME_SIZES.find(s => s.key === form.propertyType)?.label ?? form.propertyType}</p>}
                  {form.squareFootage && <p className="text-xs text-muted">{form.squareFootage} sq ft</p>}
                </div>
              </div>
              <div className="h-px bg-gray-100" />

              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Services selected</p>
                <div className="flex flex-wrap gap-2">
                  {form.serviceTypes.map(s => (
                    <span key={s} className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold">{s}</span>
                  ))}
                </div>
              </div>
              <div className="h-px bg-gray-100" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted font-semibold mb-0.5">Location</p>
                  <p className="text-ink font-semibold">{form.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted font-semibold mb-0.5">Preferred date</p>
                  <p className="text-ink font-semibold">
                    {new Date(form.preferredDate).toLocaleDateString('en-NG', { dateStyle: 'long' })}
                    {form.preferredTime && ` at ${form.preferredTime}`}
                  </p>
                </div>
                {form.isRecurring && (
                  <div>
                    <p className="text-xs text-muted font-semibold mb-0.5">Recurring</p>
                    <p className="text-ink font-semibold capitalize">{form.recurringFreq}</p>
                  </div>
                )}
                {form.contactPersonName && (
                  <div>
                    <p className="text-xs text-muted font-semibold mb-0.5">Contact on site</p>
                    <p className="text-ink font-semibold">{form.contactPersonName}{form.contactPersonPhone && ` · ${form.contactPersonPhone}`}</p>
                  </div>
                )}
                {form.floorCount && (
                  <div>
                    <p className="text-xs text-muted font-semibold mb-0.5">Floors</p>
                    <p className="text-ink font-semibold">{form.floorCount}</p>
                  </div>
                )}
                {form.specialZones.length > 0 && (
                  <div className="col-span-full">
                    <p className="text-xs text-muted font-semibold mb-0.5">Special zones</p>
                    <p className="text-ink font-semibold">{form.specialZones.join(', ')}</p>
                  </div>
                )}
                {form.constructionType && (
                  <div>
                    <p className="text-xs text-muted font-semibold mb-0.5">Construction type</p>
                    <p className="text-ink font-semibold">{form.constructionType}</p>
                  </div>
                )}
                {form.constructionStage && (
                  <div>
                    <p className="text-xs text-muted font-semibold mb-0.5">Construction stage</p>
                    <p className="text-ink font-semibold">{form.constructionStage}</p>
                  </div>
                )}
              </div>

              {form.specialRequest && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div>
                    <p className="text-xs text-muted font-semibold mb-0.5">Special request</p>
                    <p className="text-sm text-ink">{form.specialRequest}</p>
                  </div>
                </>
              )}

              {photos.length > 0 && (
                <>
                  <div className="h-px bg-gray-100" />
                  <div>
                    <p className="text-xs text-muted font-semibold mb-2">{photos.length} photo{photos.length > 1 ? 's' : ''} attached</p>
                    <div className="flex gap-2 flex-wrap">
                      {previews.map((src, i) => (
                        <img key={i} src={src} alt="" className="size-14 rounded-xl object-cover" />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-sm text-amber-800">
              <p className="font-bold mb-0.5">No payment yet — just a request</p>
              <p className="text-xs">
                {form.category === 'CONSTRUCTION'
                  ? 'Our team will schedule an on-site inspection and send a quote within 24 hours of the visit.'
                  : 'Our team will review your request and send a personalised quote within 24 hours via notification and email.'}
              </p>
            </div>
          </div>
        );
      }

      default: return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <button
        onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/cleaning')}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> {step === 0 ? 'Back to Cleaning Services' : 'Back'}
      </button>

      <div className="flex gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn('h-1.5 rounded-full flex-1 transition-all duration-300',
              i < step ? 'bg-primary' : i === step ? 'bg-primary/50' : 'bg-gray-100')}
          />
        ))}
      </div>
      <p className="text-xs text-muted mb-6">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-6 py-3 border border-gray-200 text-muted font-bold rounded-2xl hover:bg-surface transition-colors"
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark disabled:opacity-40 transition-colors"
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : 'Submit Request'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reusable service toggle ───────────────────────────────────────────────────

function ServiceToggle({ label, selected, onToggle, isAddOn }: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  isAddOn?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 p-3.5 rounded-2xl border text-sm text-left transition-all',
        selected ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-gray-100 bg-white text-ink hover:border-gray-200'
      )}
    >
      <div className={cn(
        'size-5 rounded-full border-2 flex items-center justify-center shrink-0',
        selected ? 'border-primary bg-primary' : 'border-gray-200'
      )}>
        {selected && <CheckCircle2 size={12} className="text-white" />}
      </div>
      {label}
      {isAddOn && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Add-on</span>}
    </button>
  );
}
