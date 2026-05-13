import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { useRef } from 'react';
import MarketCard from '../components/MarketCard';
import { GridSkeleton } from '../components/LoadingSkeleton';
import type { Market } from '../types/api';
import { ArrowRight, ShoppingBag, Wrench, Home as HomeIcon, Star, Zap, Shield, Clock } from 'lucide-react';
import Card3D from '../components/Card3D';

async function fetchMarkets(): Promise<Market[]> {
  const { data } = await axios.get('/markets');
  return data;
}

const SERVICES = [
  {
    icon: ShoppingBag,
    color: 'from-primary to-primary-dark',
    glow: 'shadow-primary/30',
    label: 'Marketplace',
    desc: 'Fresh groceries & goods from 20+ Lagos markets, sourced daily.',
    href: '/marketplace',
  },
  {
    icon: Wrench,
    color: 'from-accent to-orange-600',
    glow: 'shadow-accent/30',
    label: 'Artisans',
    desc: 'Skilled craftsmen for repairs, installations & creative work.',
    href: '/artisans',
  },
  {
    icon: HomeIcon,
    color: 'from-indigo-500 to-purple-600',
    glow: 'shadow-indigo-500/30',
    label: 'Short-lets',
    desc: 'Furnished apartments for short stays anywhere in Lagos.',
    href: '/shortlets',
  },
];

const STATS = [
  { value: '20+', label: 'Markets covered' },
  { value: '500+', label: 'Active vendors' },
  { value: '4.8★', label: 'Average rating' },
  { value: '2hr', label: 'Avg delivery' },
];

const FEATURES = [
  { icon: Zap,    label: 'Same-day sourcing',   desc: 'Order by 10am, items sourced & packed same day.' },
  { icon: Shield, label: 'Price guarantee',      desc: 'If prices fluctuate after confirmation, we cover the difference.' },
  { icon: Star,   label: 'Vetted vendors',       desc: 'Every vendor is verified, rated, and quality-checked.' },
  { icon: Clock,  label: 'Live order tracking',  desc: 'Follow your order from market to doorstep in real time.' },
];

const stagger: { container: Variants; item: Variants } = {
  container: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  },
  item: {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  },
};

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });

  // Parallax transforms
  const heroY      = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const blob1Y     = useTransform(scrollYProgress, [0, 1], ['0%', '-40%']);
  const blob2Y     = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);

  const { data: markets = [], isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: fetchMarkets,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="overflow-x-hidden">

      {/* ══ HERO ══════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Mesh background */}
        <div className="absolute inset-0 mesh-bg" />

        {/* Animated blobs */}
        <motion.div
          style={{ y: blob1Y }}
          className="absolute top-[-10%] right-[-5%] size-[600px] rounded-full bg-primary/10 blur-[100px] pointer-events-none animate-blob"
        />
        <motion.div
          style={{ y: blob2Y }}
          className="absolute bottom-[-15%] left-[-10%] size-[500px] rounded-full bg-accent/8 blur-[80px] pointer-events-none"
        />
        <div className="absolute top-1/3 left-1/4 size-[300px] rounded-full bg-primary/6 blur-[60px] pointer-events-none animate-float-slow" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(#008577 1px, transparent 1px),
              linear-gradient(90deg, #008577 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Main hero content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-primary text-sm font-bold mb-8 shadow-sm"
          >
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            Lagos' #1 Community Marketplace
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-ink leading-[1.05] mb-6"
          >
            Your market,{' '}
            <span className="gradient-text">delivered</span>
            <br />to your door.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
            className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Shop from Balogun, Mile 12, Eko, and 20+ Lagos markets. Book artisans.
            Find short-lets. All in one platform built for Lagos life.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, type: 'spring', stiffness: 200 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            <Link to="/marketplace">
              <motion.div
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-base shadow-xl shadow-primary/30 hover:bg-primary-dark transition-colors"
                whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(0,133,119,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                <ShoppingBag size={20} />
                Start Shopping
                <ArrowRight size={16} />
              </motion.div>
            </Link>
            <Link to="/artisans">
              <motion.div
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl glass border border-primary/20 text-ink font-bold text-base hover:border-primary/40 transition-colors"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Hire an Artisan
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="glass rounded-2xl p-4 text-center"
              >
                <div className="text-2xl font-black text-ink">{stat.value}</div>
                <div className="text-xs text-muted font-medium mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted font-medium">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="size-6 rounded-full border-2 border-primary/30 flex items-center justify-center"
          >
            <div className="size-1.5 rounded-full bg-primary" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══ SERVICES ═══════════════════════════════════ */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-10 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-black text-ink tracking-tight mb-4">
            One platform,<br className="sm:hidden" /> every need.
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Everything Lagos needs — market goods, skilled hands, and a place to stay.
          </p>
        </motion.div>

        <motion.div
          variants={stagger.container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {SERVICES.map(s => (
            <motion.div key={s.label} variants={stagger.item}>
              <Card3D intensity={8} glare scale={1.03}>
                <Link to={s.href}>
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-shadow group h-full">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} shadow-lg ${s.glow} flex items-center justify-center mb-6`}>
                      <s.icon size={26} className="text-white" />
                    </div>
                    <h3 className="text-xl font-black text-ink mb-2">{s.label}</h3>
                    <p className="text-muted text-sm leading-relaxed mb-6">{s.desc}</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                      Explore <ArrowRight size={15} />
                    </div>
                  </div>
                </Link>
              </Card3D>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══ MARKETS ════════════════════════════════════ */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-10 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-wrap items-end justify-between gap-4 mb-10"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-ink tracking-tight mb-2">
              Shop by Market
            </h2>
            <p className="text-muted">Sourced directly from Lagos' most vibrant hubs.</p>
          </div>
          <Link
            to="/marketplace"
            className="flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all"
          >
            View all markets <ArrowRight size={15} />
          </Link>
        </motion.div>

        {isLoading ? (
          <GridSkeleton count={6} variant="market" />
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {markets.slice(0, 6).map(market => (
              <motion.div key={market.id} variants={stagger.item}>
                <MarketCard {...market} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ══ FEATURES BENTO ═════════════════════════════ */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-10 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-black text-ink tracking-tight mb-3">
            Why choose Ayanfe?
          </h2>
          <p className="text-muted max-w-lg mx-auto">
            Built from the ground up for the Lagos market experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200 }}
              className="group relative overflow-hidden bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-black/5 transition-all"
            >
              {/* hover accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <f.icon size={22} className="text-primary" />
              </div>
              <h4 className="font-black text-ink text-lg mb-2">{f.label}</h4>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ CTA BANNER ═════════════════════════════════ */}
      <section className="max-w-[1280px] mx-auto px-6 md:px-10 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="relative overflow-hidden rounded-3xl p-10 md:p-16 mesh-bg-dark"
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 size-64 bg-primary/30 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 size-48 bg-accent/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-primary/80 font-bold text-sm uppercase tracking-widest mb-3">Ready to start?</p>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                Your local market,<br />just a tap away.
              </h2>
              <p className="text-white/50 text-sm max-w-md">
                Join thousands of Lagos residents who shop smarter with Ayanfe every day.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link to="/marketplace">
                <motion.div
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/40 hover:bg-primary-dark transition-colors"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <ShoppingBag size={18} /> Shop Now
                </motion.div>
              </Link>
              <Link to="/artisans">
                <motion.div
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl glass-dark text-white font-bold hover:border-white/20 transition-colors"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Hire Artisan
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
