import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Building2, HardHat, CheckCircle2, ChevronRight,
  Bell, CreditCard, Star, Shield, Clock,
} from 'lucide-react';
import { cn } from '../lib/utils';

// ── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'HOME' as const,
    icon: Home,
    title: 'Home Cleaning',
    subtitle: 'Apartments, duplexes, shortlets & homes',
    gradient: 'from-primary to-primary-dark',
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    iconColor: 'text-primary',
    services: [
      'Basic cleaning',
      'Deep cleaning',
      'Move-in / move-out cleaning',
      'Laundry & ironing add-on',
      'Kitchen deep clean',
      'Bathroom sanitization',
    ],
    pricing: [
      { label: 'Self-contained', hint: 'Starting price' },
      { label: '1-bedroom', hint: 'Standard rate' },
      { label: '2-bedroom', hint: 'Standard rate' },
      { label: '3-bedroom+', hint: 'Premium rate' },
      { label: 'Hourly option', hint: 'Per hour' },
      { label: 'Add-ons available', hint: 'Laundry, kitchen, bathroom' },
    ],
    pricingNote: 'Priced by apartment size, hours, or add-ons.',
  },
  {
    id: 'OFFICE' as const,
    icon: Building2,
    title: 'Office Cleaning',
    subtitle: 'SMEs, coworking spaces, schools, clinics & corporates',
    gradient: 'from-muted to-primary-dark',
    bg: 'bg-muted/5',
    border: 'border-muted/20',
    iconColor: 'text-muted',
    services: [
      'One-time cleaning',
      'Daily / weekly subscription',
      'Janitorial support',
      'Carpet cleaning',
      'Restroom maintenance',
      'Workspace disinfection',
    ],
    pricing: [
      { label: 'By square footage', hint: 'Office size matters' },
      { label: 'By room / workstation', hint: 'Flexible headcount pricing' },
      { label: 'Recurring subscription', hint: 'Daily or weekly plans' },
    ],
    pricingNote: 'Priced by square footage, workstations, or subscription.',
  },
  {
    id: 'CONSTRUCTION' as const,
    icon: HardHat,
    title: 'Construction Site Cleaning',
    subtitle: 'High-value post-build cleaning with premium margins',
    gradient: 'from-accent to-muted',
    bg: 'bg-accent/5',
    border: 'border-accent/20',
    iconColor: 'text-accent',
    services: [
      'Post-construction debris removal',
      'Industrial dust removal',
      'Window & glass cleaning',
      'Floor polishing',
      'Final finishing cleanup',
      'Before-occupancy inspection',
    ],
    pricing: [
      { label: 'By site size', hint: 'Square footage quoted' },
      { label: 'Inspection-based quote', hint: 'Admin visits or reviews photos' },
      { label: 'Before & after assessment', hint: 'Documented handover' },
    ],
    pricingNote: 'Priced after site inspection or photo review.',
  },
];

const HOW_IT_WORKS = [
  { icon: Home,         label: 'Choose a category',   desc: 'Home, Office, or Construction Site' },
  { icon: Bell,         label: 'Submit your request',  desc: 'Share details, photos & preferred date' },
  { icon: Clock,        label: 'Receive your quote',   desc: "We'll price it and send a quote within 24 h" },
  { icon: CreditCard,   label: 'Pay a deposit',        desc: 'Secure your slot with a small deposit' },
  { icon: Shield,       label: 'Cleaner dispatched',   desc: 'A verified cleaner is assigned to you' },
  { icon: Star,         label: 'Rate & review',        desc: 'Share your feedback after completion' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CleaningServices() {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-12">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
          <Star size={14} /> Professional Cleaning Services
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-ink tracking-tight mb-4">
          Spotless spaces,<br />
          <span className="text-primary">stress-free.</span>
        </h1>
        <p className="text-lg text-ink/70 max-w-xl mx-auto">
          Trusted cleaners for homes, offices, and construction sites across Lagos.
          Submit a request and get a custom quote within 24 hours.
        </p>
      </motion.div>

      {/* ── Category Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          const isHovered = hoveredId === cat.id;
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'relative flex flex-col rounded-3xl border p-6 transition-all duration-200 group',
                cat.bg, cat.border,
                isHovered && 'shadow-xl -translate-y-1 border-transparent'
              )}
            >
              {/* Icon */}
              <div className={cn('size-12 rounded-2xl flex items-center justify-center mb-4', `bg-gradient-to-br ${cat.gradient}`)}>
                <Icon size={22} className="text-white" />
              </div>

              <h2 className="text-xl font-black text-ink mb-1">{cat.title}</h2>
              <p className="text-sm text-ink/70 mb-5">{cat.subtitle}</p>

              {/* Services */}
              <ul className="space-y-2 mb-5 flex-1">
                {cat.services.map(s => (
                  <li key={s} className="flex items-center gap-2 text-sm text-ink/80">
                    <CheckCircle2 size={13} className={cn('shrink-0', cat.iconColor)} />
                    {s}
                  </li>
                ))}
              </ul>

              {/* Pricing hint */}
              <div className="rounded-2xl bg-white/60 border border-white px-4 py-3 mb-5">
                <p className="text-xs font-bold text-ink mb-2">Pricing model</p>
                <div className="space-y-1">
                  {cat.pricing.slice(0, 3).map(p => (
                    <div key={p.label} className="flex justify-between text-xs">
                      <span className="text-ink/65">{p.label}</span>
                      <span className="text-ink font-semibold">{p.hint}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-ink/50 mt-2 italic">{cat.pricingNote}</p>
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate('/cleaning/book', { state: { category: cat.id } })}
                className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition-opacity',
                `bg-gradient-to-r ${cat.gradient}`,
                isHovered ? 'opacity-100' : 'opacity-90'
              )}>
                Book {cat.title.split(' ')[0]} Cleaning
                <ChevronRight size={16} />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <div className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-ink mb-2">How it works</h2>
          <p className="text-ink/70">Simple 6-step process from request to spotless.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-3">
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 size-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <p className="text-xs font-bold text-ink mb-0.5">{step.label}</p>
                <p className="text-[11px] text-ink/65">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Trust Badges ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div>
          <h3 className="text-xl font-black text-ink mb-1">Ready to get started?</h3>
          <p className="text-ink/70 text-sm">
            No instant prices — we send you a <span className="font-bold text-ink">custom quote within 24 hours</span> via in-app notification and email.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => navigate('/cleaning/book', { state: { category: cat.id } })}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:-translate-y-0.5',
                  `bg-gradient-to-r ${cat.gradient}`
                )}
              >
                <Icon size={16} />
                {cat.title.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Quote note ───────────────────────────────────────────────── */}
      <div className="mt-8 flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-2xl px-5 py-4">
        <Bell size={18} className="text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-ink">Quotes sent within 24 hours</p>
          <p className="text-xs text-ink/80 mt-0.5">
            After you submit your request, our team reviews the details and sends you a personalised price via your in-app notification bell and email. No automated guessing — real quotes from real people.
          </p>
        </div>
      </div>

    </div>
  );
}
