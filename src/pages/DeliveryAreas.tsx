import { motion } from 'framer-motion';
import { MapPin, Truck, Clock, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export default function DeliveryAreas() {
  const regions = [
    {
      name: 'Lagos Metropolitan Area',
      desc: 'All major parts of Lagos State including Mainland, Island, Lekki, Ikeja, Surulere, Ikorodu, Epe, and Badagry.',
      time: 'Same-day or next-day scheduled consolidated shipping.',
      rates: 'Starts from ₦1,500 (based on delivery zone distance).'
    },
    {
      name: 'Mowe-Ibafo Axis',
      desc: 'Including Mowe, Ibafo, Magboro, and neighboring communities along the Lagos-Ibadan Expressway.',
      time: 'Next-day scheduled consolidated shipping.',
      rates: 'Starts from ₦2,500 (special outbound route pricing).'
    }
  ];

  const highlights = [
    {
      title: 'Consolidated Delivery Days',
      desc: 'We group deliveries weekly to optimize paths and reduce shipping costs, passing 100% of those savings to you.',
      icon: Truck
    },
    {
      title: 'Real-time Tracking & WhatsApp Alerts',
      desc: 'Get notified automatically on WhatsApp when your foodstuffs are sourced, arrive at the hub, and leave for delivery.',
      icon: Clock
    },
    {
      title: 'Freshness Guaranteed',
      desc: 'Items are transported in climate-controlled bags directly from local market stalls to your doorstep.',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAF9] pb-20">
      {/* Banner Header */}
      <div className="relative overflow-hidden mesh-bg py-16 md:py-24 border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 relative z-10 text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <MapPin size={12} /> Coverage Information
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-ink tracking-tight">Delivery Coverage</h1>
          <p className="text-sm md:text-base text-ink/75 leading-relaxed">
            Ayanfe delivers fresh market foodstuffs, custom artisan services, and logistics requests across Lagos and surrounding communities.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-16 space-y-16">
        
        {/* Coverage Areas Section */}
        <div className="space-y-6">
          <h2 className="text-xl md:text-2xl font-black text-ink text-center">Active Delivery Regions</h2>
          <p className="text-xs text-muted text-center max-w-md mx-auto leading-relaxed">
            We currently deliver to the following regions. If your location is outside these, contact support to coordinate custom charter delivery.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-10">
            {regions.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-5 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Accent line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />

                <div className="space-y-2">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                    <MapPin size={20} />
                  </div>
                  <h3 className="text-base font-black text-ink">{r.name}</h3>
                  <p className="text-xs text-ink/75 leading-relaxed">{r.desc}</p>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-3 text-xs">
                  <div className="flex gap-2">
                    <span className="font-bold text-muted w-24 shrink-0">Schedule:</span>
                    <span className="text-ink/80">{r.time}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-muted w-24 shrink-0">Delivery Fee:</span>
                    <span className="text-primary font-bold">{r.rates}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sourcing & Shipping Schedule Policy */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-ink flex items-center gap-2">
              <Clock className="text-primary" size={18} /> Sourcing & Sourcing Consolidated Policy
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              To support our weekly consolidated purchases and preserve stable pricing with our market vendors, please review our logistics guidelines:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-xs text-ink/80 leading-relaxed">
            <div className="space-y-2.5 p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
              <h4 className="font-bold text-primary flex items-center gap-1.5">
                <Check size={14} className="shrink-0" /> Market Assignment & Cut-off Times
              </h4>
              <p>
                Each market location has an assigned delivery date and a strict payment cut-off time. We do not accept payments after the cut-off time because market prices change rapidly, and we need to group purchases together to coordinate with our vetted vendors.
              </p>
            </div>
            <div className="space-y-2.5 p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
              <h4 className="font-bold text-primary flex items-center gap-1.5">
                <Check size={14} className="shrink-0" /> Multi-Market Consolidated Delivery
              </h4>
              <p>
                If you purchase items from different markets in a single order, you will not receive multiple shipments on individual market dates. Instead, your order will be delivered on a single consolidated delivery date. This ensures you pay only a single delivery fee. Your consolidated delivery date will be calculated and provided to you after your purchase is confirmed.
              </p>
            </div>
          </div>

          {/* Other Services Policy Banner */}
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-3 text-xs leading-relaxed text-ink/85">
            <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-ink block mb-0.5">Shortlet & Cleaning Services Payment Policy</span>
              <p>
                For our serviced apartments (shortlets) and professional cleaning bookings, payments are not processed immediately. Payment can only be made after our team reviews your request, confirms availability/details, and updates your quote status.
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Features Grid */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-sm space-y-8">
          <h3 className="text-lg font-black text-ink text-center">Why ship foodstuffs with Ayanfe?</h3>
          <div className="grid sm:grid-cols-3 gap-8">
            {highlights.map((h, idx) => {
              const Icon = h.icon;
              return (
                <div key={idx} className="space-y-3 text-center sm:text-left">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto sm:mx-0 shadow-sm">
                    <Icon size={18} />
                  </div>
                  <h4 className="font-bold text-xs text-ink">{h.title}</h4>
                  <p className="text-xs text-muted leading-relaxed">{h.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Out of zone help */}
        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="font-black text-sm text-ink">Outside our standard delivery zone?</h4>
            <p className="text-xs text-ink/75 leading-relaxed">
              We can coordinate special charter dispatches for diaspora bulk buyers or large events outside active regions.
            </p>
          </div>
          <a
            href="/help"
            className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-dark shadow-md shadow-primary/20 transition-all shrink-0"
          >
            Contact Help Center
          </a>
        </div>

      </div>
    </div>
  );
}
