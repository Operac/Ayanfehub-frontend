import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalSearch from '../components/GlobalSearch';
import NotificationBell from '../components/NotificationBell';
import { ShoppingCart, Menu, X, ChevronDown, Store, LayoutDashboard, LogOut, User, Package } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Artisans',    path: '/artisans'    },
  { name: 'Short-lets',  path: '/shortlets'   },
  { name: 'Group Buy',   path: '/group-buy'   },
  { name: 'Cleaning',    path: '/cleaning'    },
  { name: 'Orders',      path: '/orders'      },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  // Shrink nav on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change (setState-in-effect is intentional here)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);


  return (
    <div className="flex min-h-screen flex-col font-sans">
      {/* ── Navigation ───────────────────────────────── */}
      <motion.header
        className="sticky top-0 z-50 w-full"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className={`mx-4 mt-3 rounded-2xl transition-all duration-300 ${
          scrolled
            ? 'glass shadow-lg shadow-black/5'
            : 'bg-white/90 backdrop-blur-sm border border-white/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between px-5 py-3 max-w-[1280px] mx-auto">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <motion.div
                className="size-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-primary/30"
                whileHover={{ scale: 1.08, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <img src="/ayanfe-logo (2).png" className="w-full h-full object-cover" alt="Ayanfe logo" />
              </motion.div>
              <span className="text-ink text-xl font-black tracking-tight">
                Ayanfe<span className="text-primary">.</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map(item => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                      active ? 'text-primary' : 'text-muted hover:text-ink hover:bg-surface'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary/10 rounded-xl"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden md:block w-52 lg:w-64">
                <GlobalSearch />
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Cart */}
              <Link to="/cart" className="relative flex items-center justify-center size-10 rounded-xl hover:bg-surface transition-colors group">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <ShoppingCart size={20} className="text-ink group-hover:text-primary transition-colors" />
                </motion.div>
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1 -right-1 size-5 flex items-center justify-center rounded-full bg-accent text-white text-[10px] font-black shadow-md shadow-accent/40"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Profile */}
              {user ? (
                <div ref={profileRef} className="relative">
                  <motion.button
                    onClick={() => setProfileOpen(v => !v)}
                    className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/30 hover:bg-primary-dark transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span>{user.fullName?.split(' ')[0] ?? (user.role === 'ADMIN' ? 'Admin' : 'Me')}</span>
                    <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={14} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="absolute right-0 top-full mt-2 w-52 glass rounded-2xl shadow-xl shadow-black/10 py-2 overflow-hidden"
                      >
                        <DropItem to="/profile" icon={<User size={15} />} label="My Profile" onClick={() => setProfileOpen(false)} />
                        <DropItem to="/orders" icon={<Package size={15} />} label="My Orders" onClick={() => setProfileOpen(false)} />
                        {user.role === 'VENDOR'  && <DropItem to="/vendor" icon={<Store size={15} />} label="Vendor Dashboard" onClick={() => setProfileOpen(false)} />}
                        {user.role === 'ARTISAN' && <DropItem to="/artisan-dashboard" icon={<LayoutDashboard size={15} />} label="Artisan Dashboard" onClick={() => setProfileOpen(false)} />}
                        {user.role === 'ADMIN'   && <DropItem to="/admin" icon={<LayoutDashboard size={15} />} label="Admin Dashboard" onClick={() => setProfileOpen(false)} />}
                        <div className="my-1 mx-3 h-px bg-gray-100" />
                        <button
                          onClick={() => { logout(); setProfileOpen(false); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/login"
                    className="flex items-center h-10 px-5 rounded-xl bg-primary text-white text-sm font-bold shadow-md shadow-primary/30 hover:bg-primary-dark transition-colors"
                  >
                    Sign In
                  </Link>
                </motion.div>
              )}

              {/* Mobile hamburger */}
              <motion.button
                onClick={() => setMenuOpen(v => !v)}
                className="lg:hidden flex items-center justify-center size-10 rounded-xl hover:bg-surface transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={menuOpen ? 'close' : 'open'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    {menuOpen ? <X size={20} /> : <Menu size={20} />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex flex-col gap-1">
                  {/* Mobile search */}
                  <div className="mb-3">
                    <GlobalSearch />
                  </div>
                  {NAV_ITEMS.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          location.pathname.startsWith(item.path)
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted hover:bg-surface hover:text-ink'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                  {user && (
                    <>
                      <div className="mt-1 h-px bg-gray-100" />
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted hover:bg-surface hover:text-ink transition-colors"><User size={14} /> My Profile</Link>
                      {user.role === 'VENDOR'  && <Link to="/vendor"            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted hover:bg-surface hover:text-ink transition-colors"><Store size={14} /> Vendor Dashboard</Link>}
                      {user.role === 'ARTISAN' && <Link to="/artisan-dashboard" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted hover:bg-surface hover:text-ink transition-colors"><LayoutDashboard size={14} /> Artisan Dashboard</Link>}
                      {user.role === 'ADMIN'   && <Link to="/admin"             className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted hover:bg-surface hover:text-ink transition-colors"><LayoutDashboard size={14} /> Admin Dashboard</Link>}
                      <button onClick={() => { logout(); setMenuOpen(false); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors w-full text-left"><LogOut size={14} /> Sign Out</button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* ── Main Content ─────────────────────────────── */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="mt-20 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 mesh-bg-dark" />
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 size-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 size-60 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10 pt-16 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="size-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-primary/40">
                  <img src="/ayanfe-logo (2).png" className="w-full h-full object-cover" alt="Ayanfe logo" />
                </div>
                <span className="text-white text-xl font-black tracking-tight">
                  Ayanfe<span className="text-primary" style={{ filter: 'brightness(1.5)' }}>.</span>
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Connecting you to the heartbeat of Lagos markets. Fresh, authentic, and delivered with care.
              </p>
              <div className="flex gap-3 mt-6">
                {[
                  { label: 'Twitter',   href: 'https://twitter.com'   },
                  { label: 'Instagram', href: 'https://instagram.com' },
                  { label: 'Facebook',  href: 'https://facebook.com'  },
                ].map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="size-9 rounded-xl glass-dark flex items-center justify-center hover:border-primary/40 transition-colors"
                  >
                    <span className="text-white/40 text-xs font-bold">{s.label[0]}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <FooterCol title="Services" links={[
              { label: 'Marketplace',     href: '/marketplace' },
              { label: 'Artisan Booking', href: '/artisans'    },
              { label: 'Short-let Stays', href: '/shortlets'   },
              { label: 'Group Buy',       href: '/group-buy'   },
              { label: 'Cleaning Services', href: '/cleaning'  },
            ]} />
            <FooterCol title="Company" links={[
              { label: 'About Us',         href: '/about'      },
              { label: 'Become a Vendor',  href: '/become-vendor' },
              { label: 'Partner with Us',  href: '/partner'    },
            ]} />
            <FooterCol title="Support" links={[
              { label: 'Help Center',    href: '/orders'      },
              { label: 'Delivery Areas', href: '/marketplace' },
              { label: 'Terms of Use',   href: '/terms'       },
            ]} />
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Ayanfe Logistics & Services. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-white/30">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DropItem({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-surface transition-colors"
    >
      <span className="text-muted">{icon}</span>
      {label}
    </Link>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h5 className="font-bold text-sm text-white mb-4">{title}</h5>
      <div className="flex flex-col gap-3">
        {links.map(l => (
          <Link key={l.label} to={l.href} className="text-sm text-white/40 hover:text-white transition-colors">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
