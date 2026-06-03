import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Shield, Scale, HelpCircle, ArrowRight, AlertTriangle, BookOpen } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface TermSection {
  id: string;
  title: string;
  icon: React.FC<any>;
  content: React.ReactNode;
}

export default function Terms() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('intro');
  const [searchQuery, setSearchQuery] = useState('');

  const sections: TermSection[] = [
    {
      id: 'intro',
      title: '1. Introduction',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-base text-ink leading-relaxed">
            Welcome to <strong>Ayanfe Hub</strong>. These Terms of Use govern your access to and use of Ayanfe’s website, mobile applications, and other services (collectively, the "Platform"). The Platform is owned and operated by Ayanfe Logistics & Services.
          </p>
          <p className="text-base text-ink leading-relaxed font-semibold">
            By accessing or using the Platform, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these terms, please do not use our Platform.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mt-4">
            <h4 className="font-bold text-sm text-ink mb-2">Key Highlights:</h4>
            <ul className="list-disc pl-5 space-y-2 text-xs text-ink/80">
              <li>Ayanfe connects users with vetted local artisans, fresh food vendors, short-let apartments, and cleaning professionals.</li>
              <li>We act as an intermediary logistics and service coordination platform.</li>
              <li>Transactions are secured, and users are expected to maintain professional conduct.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'services',
      title: '2. Our Services',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <p className="text-base text-ink leading-relaxed">
            Ayanfe provides a multi-service gateway designed to bridge the gap between consumers and quality Lagos market products or home services. Our services consist of:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="border border-gray-100 rounded-xl p-4 bg-white">
              <h5 className="font-bold text-xs text-muted uppercase tracking-wide mb-1">Marketplace & Group Buy</h5>
              <p className="text-xs text-ink/70">Sourcing fresh foodstuffs directly from major Lagos markets. Group Buy enables collective purchasing power to lower prices.</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4 bg-white">
              <h5 className="font-bold text-xs text-muted uppercase tracking-wide mb-1">Artisan Bookings</h5>
              <p className="text-xs text-ink/70">Connecting you to certified plumbers, electricians, painters, and other skilled service professionals.</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4 bg-white">
              <h5 className="font-bold text-xs text-muted uppercase tracking-wide mb-1">Short-let Apartments</h5>
              <p className="text-xs text-ink/70">Providing secure, fully-serviced temporary apartments for short stays with vetted host verification.</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4 bg-white">
              <h5 className="font-bold text-xs text-muted uppercase tracking-wide mb-1">Cleaning Services</h5>
              <p className="text-xs text-ink/70">Professional grade residential, commercial corporate cleaning, and post-construction site cleanup.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'accounts',
      title: '3. Accounts & Security',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-base text-ink leading-relaxed">
            To access certain features of the Platform (such as making reservations or requests), you must create a registered account.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800">
            <p className="font-bold mb-1 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" /> Account Accountability
            </p>
            <p className="leading-relaxed">
              You are entirely responsible for safeguarding your password and account details. You agree to notify Ayanfe immediately of any unauthorized use of your credentials. Ayanfe will not be held liable for losses incurred due to compromised accounts.
            </p>
          </div>
          <p className="text-sm text-ink leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate community rules, engage in fraudulent transactions, or abuse promotional discounts.
          </p>
        </div>
      )
    },
    {
      id: 'payments',
      title: '4. Payments & Refund Policies',
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p className="text-base text-ink leading-relaxed">
            All prices on the Platform are quoted in Nigerian Naira (NGN). Payments are processed securely via our integrated payment gateways.
          </p>
          <div className="space-y-3">
            <div className="border-l-4 border-primary pl-4 py-1">
              <h5 className="font-bold text-sm text-ink">Service Estimates & Quotes</h5>
              <p className="text-xs text-ink/70 leading-relaxed">Artisan fees, cleaning quotes, and custom delivery costs are subject to change based on actual assessment. Final quotes will be sent via notifications and email for user authorization before service commencement.</p>
            </div>
            <div className="border-l-4 border-accent pl-4 py-1">
              <h5 className="font-bold text-sm text-ink">Refund and Cancellation Thresholds</h5>
              <ul className="list-disc pl-4 space-y-1 text-xs text-ink/70 mt-1">
                <li><strong>Short-lets:</strong> Cancel up to 48 hours prior to check-in for a 100% refund. Cancellations made within 48 hours incur a 50% booking fee deduction.</li>
                <li><strong>Artisans & Cleaning:</strong> Cancellations made after provider dispatch will incur a travel/logistics cost fee of NGN 2,500.</li>
                <li><strong>Marketplace Purchases:</strong> Fresh goods and foodstuffs cannot be returned or refunded once inspected and accepted at delivery.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'liability',
      title: '5. Limitation of Liability',
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <p className="text-base text-ink leading-relaxed">
            Ayanfe strives to maintain excellent service quality. However, Ayanfe acts as a coordinating agent and logistics intermediary.
          </p>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-xs text-red-800 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-red-900">
              <AlertTriangle size={14} className="text-red-700" /> Crucial Liability Limit
            </p>
            <p className="leading-relaxed">
              AYANFE LOGISTICS & SERVICES, ITS PARTNERS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OF OR INABILITY TO USE THE PLATFORM. THIS INCLUDES, BUT IS NOT LIMITED TO, LOSS OF REVENUE, LOSS OF PROFITS, PROPERTY DAMAGE, OR PERSONAL INJURY STEMMING FROM INDEPENDENT ARTISAN OR THIRD-PARTY VENDOR DELIVERIES.
            </p>
          </div>
          <p className="text-sm text-ink leading-relaxed">
            All services are provided "as is" and "as available" without warranty of any kind, either express or implied.
          </p>
        </div>
      )
    },
    {
      id: 'support',
      title: '6. Support & Disputes',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <p className="text-base text-ink leading-relaxed">
            We value your satisfaction. If you encounter issues with any service (e.g., poor artisan output, incomplete cleaning, wrong market items), you can lodge a formal complaint.
          </p>
          <p className="text-sm text-ink leading-relaxed">
            All disputes should be reported within <strong>24 hours</strong> of service completion. You can file a dispute directly through the <strong>Disputes Tab</strong> on your Orders dashboard, or contact our customer support team.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => showToast('Redirecting to Support Chat...', 'success')}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors flex items-center gap-1.5 shadow-md shadow-primary/20"
            >
              Contact Support <ArrowRight size={13} />
            </button>
            <button
              onClick={() => showToast('Help Center articles are loading...', 'info')}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-muted text-xs font-bold hover:bg-surface transition-colors"
            >
              Browse FAQs
            </button>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(sec => 
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sec.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9FAF9] pb-20">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden mesh-bg py-16 md:py-20 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-xl mx-auto space-y-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <FileText size={12} /> Ayanfe Legal Documentation
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-ink tracking-tight">Terms of Use</h1>
            <p className="text-sm text-ink/75 leading-relaxed">
              Please read these terms carefully before using Ayanfe Hub. They contain important information about your legal rights, remedies, and obligations.
            </p>
            <p className="text-xs text-muted font-semibold">Last Updated: June 4, 2026</p>
          </motion.div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 mt-12 grid lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-muted uppercase tracking-wide">Document Outline</h3>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search terms..."
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <FileText size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/50" />
            </div>

            <nav className="flex flex-col gap-1.5">
              {filteredSections.map(sec => {
                const ActiveIcon = sec.icon;
                const isActive = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                      isActive 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'text-muted hover:bg-surface hover:text-ink'
                    }`}
                  >
                    <ActiveIcon size={14} className={isActive ? 'text-white' : 'text-muted'} />
                    <span>{sec.title.split('. ')[1]}</span>
                  </button>
                );
              })}
              {filteredSections.length === 0 && (
                <p className="text-xs text-muted text-center py-4">No sections match your search.</p>
              )}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <AnimatePresence mode="wait">
              {sections.map(sec => {
                if (sec.id !== activeTab) return null;
                const SecIcon = sec.icon;
                return (
                  <motion.div
                    key={sec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <SecIcon size={18} />
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-ink tracking-tight">{sec.title}</h2>
                    </div>
                    
                    {sec.content}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
