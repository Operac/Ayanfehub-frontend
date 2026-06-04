import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ExternalLink, ShieldCheck } from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans">

      {/* ── Admin Header ──────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-360 mx-auto px-5 h-14 flex items-center justify-between gap-4">

          {/* Left — logo + badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/admin" className="flex items-center gap-2.5 group">
              <div className="size-8 rounded-lg overflow-hidden shadow-md shadow-primary/20">
                <img src="/ayanfe-logo (2).png" className="w-full h-full object-cover" alt="Ayanfe logo" />
              </div>
              <span className="text-ink text-base font-black tracking-tight">
                Ayanfe<span className="text-primary">.</span>
              </span>
            </Link>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-lg">
              <ShieldCheck size={12} className="text-primary" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wide">Admin</span>
            </div>
          </div>

          {/* Right — view site + admin name + logout */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-ink transition-colors"
            >
              <ExternalLink size={12} />
              View Site
            </Link>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-[10px] font-black">
                  {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
                </span>
              </div>
              <span className="text-xs font-semibold text-ink hidden sm:block">
                {user?.fullName?.split(' ')[0] ?? 'Admin'}
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={12} />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Page Content ──────────────────────────────── */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname + location.search}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
