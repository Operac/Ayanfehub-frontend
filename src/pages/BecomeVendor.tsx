import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, User, Phone, MapPin, Loader2, CheckCircle, ArrowRight, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import type { Market } from '../types/api';

async function fetchMarkets(): Promise<Market[]> {
  const { data } = await axios.get('/markets');
  return data;
}

export default function BecomeVendor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [marketId, setMarketId] = useState('');
  const [stallReference, setStallReference] = useState('');

  // Fetch markets for selection
  const { data: markets, isLoading: loadingMarkets } = useQuery({
    queryKey: ['markets-list'],
    queryFn: fetchMarkets
  });

  // Check if user already has vendor profiles
  const { data: existingProfile, isLoading: checkingExisting } = useQuery({
    queryKey: ['my-vendor-profile-check'],
    queryFn: async () => {
      try {
        const { data } = await axios.get('/vendors/me');
        return data;
      } catch (err: any) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!user,
    retry: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to apply.', 'warning');
      navigate('/login', { state: { from: '/become-vendor' } });
      return;
    }
    if (!businessName.trim() || !marketId || !contactName.trim() || !phone.trim()) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/vendors/apply', {
        businessName: businessName.trim(),
        marketId,
        contactName: contactName.trim(),
        phone: phone.trim(),
        stallReference: stallReference.trim() || undefined
      });
      setSubmitted(true);
      showToast('Vendor application submitted successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit application. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary mb-2" />
        <p className="text-xs text-muted">Checking account profile status...</p>
      </div>
    );
  }

  // User is already verified vendor
  if (existingProfile && existingProfile.verificationStatus === 'VERIFIED') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-md">
          <Store size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-ink">You are a Vetted Vendor!</h2>
          <p className="text-sm text-muted leading-relaxed">
            Your vendor profile for <strong>{existingProfile.businessName}</strong> is active and verified. You can manage your products, orders, and view sales stats from your dashboard.
          </p>
        </div>
        <button
          onClick={() => navigate('/vendor')}
          className="px-6 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark shadow-md shadow-primary/20 flex items-center gap-1.5 mx-auto transition-colors"
        >
          Go to Vendor Dashboard <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  // User has a pending application
  if (existingProfile && existingProfile.verificationStatus === 'PENDING') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto shadow-md">
          <Loader2 size={32} className="animate-spin-slow" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-ink">Application Under Review</h2>
          <p className="text-sm text-muted leading-relaxed">
            We have received your application for <strong>{existingProfile.businessName}</strong>. Our operations team is currently vetting your market stall details.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 text-left mt-4 space-y-1">
            <p className="font-bold">Next Steps:</p>
            <p>1. Our team verifies your market location and contact credentials.</p>
            <p>2. Once vetted, your status changes to verified and you get email credentials.</p>
            <p>3. This process usually takes 24–48 business hours.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-muted font-bold hover:bg-surface text-xs transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAF9] pb-20">
      {/* Banner Header */}
      <div className="relative overflow-hidden mesh-bg py-16 md:py-24 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 relative z-10 text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Store size={12} /> Digital Marketplace Enablement
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-ink tracking-tight">Become a Vendor</h1>
          <p className="text-sm md:text-base text-ink/75 leading-relaxed">
            Take your market store online. Reach thousands of customers across Lagos, receive organized orders, and secure payouts.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-16">
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="vendor-form-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="font-black text-lg text-ink">Vendor Registration Form</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Provide accurate store details. Once our team verifies your shop location, we will activate your dashboard.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Business / Stall Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Store size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text" required value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                        placeholder="e.g. Iya Alaso Groceries"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Contact Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text" required value={contactName}
                          onChange={e => setContactName(e.target.value)}
                          placeholder="e.g. Kudirat Balogun"
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Contact Phone <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="tel" required value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="e.g. 0802 345 6789"
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Lagos Market Location <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <select
                        required
                        value={marketId}
                        onChange={e => setMarketId(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white text-xs"
                      >
                        <option value="">Select your market...</option>
                        {loadingMarkets ? (
                          <option disabled>Loading markets...</option>
                        ) : (
                          markets?.map((m: Market) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Stall Reference / Number <span className="text-muted font-normal">(optional)</span></label>
                    <input
                      type="text" value={stallReference}
                      onChange={e => setStallReference(e.target.value)}
                      placeholder="e.g. Block C, Shop 42, near the main gate"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                    />
                  </div>

                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-3.5 flex gap-2.5 text-xs text-ink/80">
                    <Info size={16} className="text-primary shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      By submitting this form, you request vendor activation on Ayanfe. An administrator will verify your shop location before approval.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={14} className="animate-spin" /> Submitting application...</>
                    ) : 'Submit Application'}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="submitted-vendor-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-5"
              >
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-black text-lg text-ink">Application Submitted!</h3>
                  <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
                    Your request has been successfully submitted to Ayanfe Administration. We will coordinate a visit to your stall location and notify you via email when verified.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-muted font-bold hover:bg-surface text-xs transition-colors"
                >
                  Return to Home
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
