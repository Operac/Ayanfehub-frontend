import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Users, Truck, Briefcase, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface PartnerType {
  id: string;
  title: string;
  icon: React.FC<any>;
  desc: string;
  benefits: string[];
}

export default function Partner() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [partnerType, setPartnerType] = useState('logistics');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');

  const partners: PartnerType[] = [
    {
      id: 'logistics',
      title: 'Logistics Partner',
      icon: Truck,
      desc: 'Collaborate as a dispatch rider, driver, or fleet operator. Help us deliver fresh foodstuffs and items across Lagos with speed and care.',
      benefits: [
        'Guaranteed regular trip volumes.',
        'Weekly payouts with transparent tracking.',
        'Flexible hours and dedicated routing.',
        'Partner bonuses and performance incentives.'
      ]
    },
    {
      id: 'corporate',
      title: 'Corporate Partner',
      icon: Briefcase,
      desc: 'Sign up for bulk workspace sourcing, automated recurring office cleaning, staff lunch subscriptions, or short-let accommodation hosting.',
      benefits: [
        'Dedicated corporate account manager.',
        'Custom monthly billing options.',
        'Pre-negotiated corporate rates.',
        'Priority service booking & support.'
      ]
    },
    {
      id: 'community',
      title: 'Community Lead',
      icon: Users,
      desc: 'Act as a neighborhood coordinator or market guide. Coordinate group-buy orders, verify local vendor listings, or manage logistics hubs.',
      benefits: [
        'Earn commissions on coordinated orders.',
        'Empower local market traders in your area.',
        'Exclusive access to platform metrics.',
        'Host Ayanfe-sponsored community events.'
      ]
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to submit a partnership proposal.', 'warning');
      navigate('/login', { state: { from: '/partner' } });
      return;
    }
    if (!fullName || !email || !phone) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/partners/apply', {
        partnerType: partnerType.toUpperCase(),
        fullName,
        email,
        phone,
        company: company || undefined,
        message: message || undefined
      });
      setSubmitted(true);
      showToast('Partnership proposal submitted successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit application. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAF9] pb-20">
      {/* Banner Header */}
      <div className="relative overflow-hidden mesh-bg py-16 md:py-24 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 relative z-10 text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Sparkles size={12} /> Ayanfe Collaborative Network
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-ink tracking-tight">Partner with Ayanfe</h1>
          <p className="text-sm md:text-base text-ink/75 leading-relaxed">
            Expand your business or earn revenue by connecting your resources with Ayanfe’s technology and logistics infrastructure.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 mt-16">
        <div className="grid lg:grid-cols-5 gap-12">
          
          {/* Benefits & Info (Left) */}
          <div className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-black text-ink">Choose how to partner</h2>
              <p className="text-xs text-muted leading-relaxed">
                Select a category below to view specific benefits, responsibilities, and earning structures.
              </p>
            </div>

            {/* Selector Grid */}
            <div className="grid sm:grid-cols-3 gap-3">
              {partners.map(p => {
                const PIcon = p.icon;
                const active = partnerType === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPartnerType(p.id)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      active 
                        ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                        : 'border-gray-100 bg-white text-ink hover:border-gray-200'
                    }`}
                  >
                    <div className={`size-8 rounded-xl flex items-center justify-center mb-3 ${active ? 'bg-primary text-white' : 'bg-gray-100 text-muted'}`}>
                      <PIcon size={16} />
                    </div>
                    <h3 className="font-bold text-xs uppercase tracking-wide">{p.title}</h3>
                  </button>
                );
              })}
            </div>

            {/* Benefits Content Panel */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
              <AnimatePresence mode="wait">
                {partners.map(p => {
                  if (p.id !== partnerType) return null;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h3 className="text-lg font-black text-ink">{p.title} Program</h3>
                        <p className="text-xs text-ink/75 leading-relaxed">{p.desc}</p>
                      </div>

                      <div className="h-px bg-gray-100" />

                      <div className="space-y-3">
                        <h4 className="font-bold text-xs text-muted uppercase tracking-wide">Key Benefits</h4>
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          {p.benefits.map(b => (
                            <div key={b} className="flex gap-2.5 items-start text-xs text-ink/80 leading-relaxed">
                              <CheckCircle size={14} className="text-primary shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Form (Right) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm sticky top-28 space-y-6">
              
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div
                    key="form-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h3 className="font-black text-base text-ink">Submit Proposal</h3>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Fill out the information below, and our business development team will reach out within 48 hours.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Selected partnership</label>
                        <select
                          value={partnerType}
                          onChange={e => setPartnerType(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                        >
                          <option value="logistics">Logistics Partner</option>
                          <option value="corporate">Corporate Partner</option>
                          <option value="community">Community Lead</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Full Name <span className="text-red-500">*</span></label>
                        <input
                          type="text" required value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="e.g. Olamide Johnson"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Email Address <span className="text-red-500">*</span></label>
                          <input
                            type="email" required value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="e.g. olamide@domain.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                          <input
                            type="tel" required value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="e.g. 0803 123 4567"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Company / Org name <span className="text-muted font-normal">(optional)</span></label>
                        <input
                          type="text" value={company}
                          onChange={e => setCompany(e.target.value)}
                          placeholder="e.g. Johnson Logistics Ltd."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Details / Proposal <span className="text-muted font-normal">(optional)</span></label>
                        <textarea
                          value={message} onChange={e => setMessage(e.target.value)}
                          placeholder="Describe your resources, fleet size, or proposed corporate collaboration..."
                          rows={3}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <><Loader2 size={14} className="animate-spin" /> Processing...</>
                        ) : 'Submit Application'}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="submitted-container"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 space-y-5"
                  >
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                      <CheckCircle size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-black text-lg text-ink">Application Received!</h3>
                      <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
                        Thank you for applying to partner with Ayanfe. A business developer will review your profile and reach out within 48 business hours.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFullName('');
                        setEmail('');
                        setPhone('');
                        setCompany('');
                        setMessage('');
                      }}
                      className="px-6 py-2.5 rounded-xl border border-gray-200 text-muted font-bold hover:bg-surface text-xs transition-colors"
                    >
                      Submit Another
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
