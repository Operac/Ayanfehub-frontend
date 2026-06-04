import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Mail, Phone, MessageSquare, HelpCircle, ChevronDown, CheckCircle2, Loader2, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface FAQ {
  q: string;
  a: string;
}

export default function HelpCenter() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // FAQ states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs: FAQ[] = [
    {
      q: 'How does foodstuff consolidation work?',
      a: 'We consolidate orders from various local Lagos markets weekly. By grouping purchases, we source fresh products in bulk directly from vendors, reducing shipping costs and passing those savings to you.'
    },
    {
      q: 'What happens if I buy from different markets?',
      a: 'If you are buying from different markets, you do not get multiple deliveries. Instead, your items are shipped on a single consolidated date so you pay only one delivery fee instead of many. Your consolidated delivery date will be calculated and given to you after purchase.'
    },
    {
      q: 'What are the market cutoff times for grocery delivery?',
      a: 'Each market has an assigned delivery date and a strict cut-off time to pay. We do not accept payments after the cut-off time due to market price fluctuations and to ensure we can coordinate our consolidated purchases on time.'
    },
    {
      q: 'When do I pay for shortlet and cleaning bookings?',
      a: 'For other services like shortlets and cleaning, payment can only be made after booking confirmation. Once our team reviews and confirms availability or details, you will be notified to proceed with payment.'
    },
    {
      q: 'How do I book cleaning services?',
      a: 'Navigate to our Cleaning tab, select the category (Home, Office, or Construction), fill in your property details, and submit. For custom services, our admin team will send you a quote or coordinate an inspection.'
    },
    {
      q: 'How can I become a verified vendor?',
      a: 'Click "Become a Vendor" in the footer, fill out the stall location form, and submit. Our logistics operations team will review your application, verify your market shop, and activate your vendor portal.'
    },
    {
      q: 'Can I track my delivery status?',
      a: 'Yes. From your "My Orders" page, you can see live tracking updates (Sourcing, At Hub, Out for Delivery, Delivered). You will also receive WhatsApp updates as status changes occur.'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/support/submit', {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim()
      });
      setSubmitted(true);
      showToast('Support message sent successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send message. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAF9] pb-20">
      {/* Hero Banner */}
      <div className="relative overflow-hidden mesh-bg py-16 md:py-24 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 relative z-10 text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <HelpCircle size={12} /> Ayanfe Support Desk
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-ink tracking-tight">How can we help you?</h1>
          <p className="text-sm md:text-base text-ink/75 leading-relaxed">
            Have questions about orders, deliveries, group buys, or partnerships? Browse our FAQs or send a direct message to our support agents.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-10 mt-16">
        <div className="grid lg:grid-cols-5 gap-12">
          
          {/* FAQ Accordion (Left) */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-xl md:text-2xl font-black text-ink flex items-center gap-2">
              <MessageSquare className="text-primary" size={22} /> Frequently Asked Questions
            </h2>

            <div className="space-y-3.5">
              {faqs.map((faq, i) => {
                const isOpen = openFaqIndex === i;
                return (
                  <div
                    key={i}
                    className="border border-gray-100 bg-white rounded-2xl overflow-hidden shadow-sm hover:border-gray-200 transition-all"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-bold text-ink hover:text-primary transition-colors"
                    >
                      <span>{faq.q}</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={14} className="text-muted" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden bg-gray-50/50"
                        >
                          <p className="px-5 pb-5 pt-1 text-xs text-ink/75 leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Direct Contact Info Card */}
            <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl grid sm:grid-cols-2 gap-6 mt-8">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-wider">Email Inquiry</span>
                <div className="flex gap-3 items-center">
                  <div className="size-10 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <Mail size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-ink">Send an Email</h4>
                    <a href="mailto:ayanfemarket@gmail.com" className="text-xs text-primary font-bold hover:underline">
                      ayanfemarket@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-wider">WhatsApp Line</span>
                <div className="flex gap-3 items-center">
                  <div className="size-10 rounded-xl bg-white border border-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <Phone size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-ink">Chat Support</h4>
                    <p className="text-xs text-muted font-semibold">+234 802 345 6789</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Support Message Form (Right) */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm sticky top-28 space-y-6">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div
                    key="support-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h3 className="font-black text-base text-ink">Contact Support</h3>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Need assistance? Fill in details below to start a conversation. Our operators review tickets 24/7.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Full Name <span className="text-red-500">*</span></label>
                        <input
                          type="text" required value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="e.g. Adebayo Alao"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Email Address <span className="text-red-500">*</span></label>
                        <input
                          type="email" required value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="e.g. adebayo@gmail.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Phone Number <span className="text-muted font-normal">(optional)</span></label>
                        <input
                          type="tel" value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="e.g. 0803 123 4567"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Subject <span className="text-red-500">*</span></label>
                        <input
                          type="text" required value={subject}
                          onChange={e => setSubject(e.target.value)}
                          placeholder="e.g. Sourcing delay on Order #1042"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-muted uppercase tracking-wide mb-1.5">Message / Inquiry <span className="text-red-500">*</span></label>
                        <textarea
                          required value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="Provide details about your query..."
                          rows={4}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 resize-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 text-xs"
                      >
                        {isSubmitting ? (
                          <><Loader2 size={13} className="animate-spin" /> Submitting ticket...</>
                        ) : (
                          <><Send size={12} /> Send Direct Message</>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="support-submitted"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10 space-y-5"
                  >
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-black text-lg text-ink">Inquiry Submitted!</h3>
                      <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
                        Your message has been logged under our help center. Our administrative staff will reply to your email address (<strong>{email}</strong>) shortly.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setSubject('');
                        setMessage('');
                      }}
                      className="px-6 py-2.5 rounded-xl border border-gray-200 text-muted font-bold hover:bg-surface text-xs transition-colors"
                    >
                      Send Another Message
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
