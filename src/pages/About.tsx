import { motion } from 'framer-motion';
import { Users, Heart, Award, ShieldCheck, Flame, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const VALUES = [
  {
    icon: Heart,
    title: 'Authenticity First',
    desc: 'We source fresh foods and products directly from original local traders in the heart of Lagos markets, preserving authentic tastes and value.'
  },
  {
    icon: Award,
    title: 'Uncompromised Quality',
    desc: 'Every artisan, vendor, and apartment listed on Ayanfe goes through a rigorous quality check and vetting process before onboarding.'
  },
  {
    icon: Users,
    title: 'Community Empowerment',
    desc: 'We build digital solutions to give local marketplace vendors, cleaning experts, and skilled artisans access to a wider customer base.'
  },
  {
    icon: ShieldCheck,
    title: 'Trust & Safety',
    desc: 'With secure transactions, live logistics coordination, and direct support, we guarantee that you get exactly what you paid for.'
  }
];

const TIMELINE = [
  {
    year: '2025',
    title: 'Seed of the Idea',
    desc: 'The seed of the idea came in 2025, conceptualized to bridge the gap between busy households and local markets.'
  },
  {
    year: '2026',
    title: 'Personal Shopping Launch',
    desc: 'We launched small-sized personal shopping in 2026 to establish trusted quality controls and sourcing networks.'
  },
  {
    year: '2026+',
    title: 'Active Expansion',
    desc: 'Now we are expanding our platform to support group buys, artisan bookings, serviced shortlets, and cleaning services.'
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#F9FAF9] pb-20 overflow-hidden">
      {/* Banner Header */}
      <div className="relative overflow-hidden mesh-bg py-20 md:py-28 border-b border-gray-100">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-radial from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Users size={12} /> Meet Ayanfe Logistics & Services
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-ink tracking-tight leading-[1.1]">
                Bridging the gap between <span className="text-primary" style={{ filter: 'brightness(0.95)' }}>Lagos Markets</span> & your doorstep.
              </h1>
              <p className="text-base text-ink/75 leading-relaxed">
                Ayanfe is more than a delivery app. We are a logistics and service ecosystem designed to simplify daily living in Lagos. From sourcing fresh groceries to finding reliable home help, we handle the stress so you can focus on what matters.
              </p>
              <div className="flex gap-4 pt-2">
                <Link
                  to="/marketplace"
                  className="px-6 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  Explore Marketplace <ChevronRight size={14} />
                </Link>
                <Link
                  to="/partner"
                  className="px-6 py-3 rounded-2xl border border-gray-200 text-ink bg-white text-sm font-bold hover:bg-surface transition-colors"
                >
                  Partner With Us
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative aspect-video lg:aspect-square max-w-md mx-auto lg:mr-0 rounded-3xl overflow-hidden shadow-2xl border border-white/50"
            >
              {/* Mesh background design card */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent opacity-20" />
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/ayanfe-logo (2).png')" }} />
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
              <div className="absolute bottom-6 left-6 right-6 glass p-6 rounded-2xl text-ink space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-muted">Our Mission</p>
                <p className="text-sm font-bold leading-relaxed">
                  "To build a trusted, seamless digital infrastructure that connects African consumers with reliable local commerce and services."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Core Values Section */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-10 mt-20">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <h2 className="text-2xl md:text-3xl font-black text-ink tracking-tight">Our Core Values</h2>
          <p className="text-sm text-muted leading-relaxed">
            The principles that guide our everyday decisions, from market sourcing to technician vetting.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((val, i) => {
            const ValIcon = val.icon;
            return (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <ValIcon size={20} />
                </div>
                <h3 className="font-black text-sm text-ink">{val.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{val.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Story / Timeline Section */}
      <section className="bg-white border-y border-gray-100 mt-24 py-20">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-4 lg:pr-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold">
                <Flame size={12} /> The Journey So Far
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-ink tracking-tight">How we evolved</h2>
              <p className="text-sm text-muted leading-relaxed">
                The seed of the idea came in 2025, and we launched small-sized personal shopping in 2026. Now, we are expanding! Today, we work with just 100+ vetted vendors and have completed over 1,000+ successful deliveries, bringing authentic market products directly to you.
              </p>
            </div>
            <div className="lg:col-span-2 space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                  className="flex gap-6 relative"
                >
                  <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white text-sm font-black shadow-lg shadow-primary/20 shrink-0 z-10">
                    {item.year}
                  </div>
                  <div className="space-y-1 pt-1">
                    <h4 className="font-bold text-sm text-ink">{item.title}</h4>
                    <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-10 mt-20">
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-[2rem] p-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          {/* Background shapes */}
          <div className="absolute inset-0 mesh-bg-dark opacity-40" />
          <div className="absolute -bottom-20 -right-20 size-80 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="pt-6 md:pt-0">
              <p className="text-3xl md:text-4xl font-black">20+</p>
              <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-1">Markets Scored</p>
            </div>
            <div className="pt-6 md:pt-0">
              <p className="text-3xl md:text-4xl font-black">100+</p>
              <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-1">Vetted Vendors</p>
            </div>
            <div className="pt-6 md:pt-0">
              <p className="text-3xl md:text-4xl font-black">1,000+</p>
              <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-1">Successful Deliveries</p>
            </div>
            <div className="pt-6 md:pt-0">
              <p className="text-3xl md:text-4xl font-black">2hr</p>
              <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-1">Average Sourcing Time</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
