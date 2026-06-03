import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Phone, Eye, EyeOff, Store, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const [usePhone, setUsePhone]   = useState(false);
  const [identifier, setId]       = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const creds = usePhone
        ? { phone: identifier, password }
        : { email: identifier, password };
      await login(creds);
      navigate('/');
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden mesh-bg-dark flex-col items-center justify-center p-16">
        {/* Blobs */}
        <div className="absolute top-0 right-0 size-96 bg-primary/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 size-72 bg-accent/15 rounded-full blur-3xl" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative z-10 text-center max-w-sm"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="size-12 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-xl shadow-primary/40">
              <Store size={24} className="text-white" />
            </div>
            <span className="text-white text-2xl font-black tracking-tight">
              Ayanfe<span className="text-primary" style={{ filter: 'brightness(1.6)' }}>.</span>
            </span>
          </div>

          <h2 className="text-3xl font-black text-white mb-4 leading-tight">
            Lagos' freshest markets,<br />in your pocket.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Shop from 20+ markets, book skilled artisans, and find the perfect short-let — all in one place.
          </p>

          {/* Floating cards */}
          <div className="mt-12 space-y-3">
            {[
              { icon: '🛒', text: 'Groceries from Balogun Market' },
              { icon: '🔧', text: 'Book a plumber in 10 minutes' },
              { icon: '🏠', text: 'Short-lets from ₦8,000/night' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                style={{ animation: `float ${5 + i}s ease-in-out infinite`, animationDelay: `${i * 0.8}s` }}
                className="flex items-center gap-3 px-4 py-3 glass-dark rounded-2xl text-left"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-white/80">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background-light">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="size-9 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
              <Store size={18} className="text-white" />
            </div>
            <span className="text-ink text-xl font-black tracking-tight">
              Ayanfe<span className="text-primary">.</span>
            </span>
          </div>

          <h1 className="text-3xl font-black text-ink tracking-tight mb-2">Welcome back</h1>
          <p className="text-muted text-sm mb-8">Sign in to continue shopping.</p>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="flex items-center gap-3 mb-6 px-4 py-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl"
              >
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Login method toggle */}
            <div className="flex rounded-2xl border border-gray-200 overflow-hidden text-sm font-semibold">
              <button type="button" onClick={() => { setUsePhone(false); setId(''); }}
                className={`flex-1 py-2.5 transition-colors ${!usePhone ? 'bg-primary text-white' : 'bg-white text-muted hover:bg-surface'}`}>
                Email
              </button>
              <button type="button" onClick={() => { setUsePhone(true); setId(''); }}
                className={`flex-1 py-2.5 transition-colors ${usePhone ? 'bg-primary text-white' : 'bg-white text-muted hover:bg-surface'}`}>
                Phone
              </button>
            </div>

            {/* Identifier (email or phone) */}
            <div>
              <label className="block text-xs font-bold text-ink mb-2">
                {usePhone ? 'Phone number' : 'Email address'}
              </label>
              <div className="relative">
                {usePhone
                  ? <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  : <Mail  size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                }
                <input
                  type={usePhone ? 'tel' : 'email'}
                  value={identifier}
                  onChange={e => setId(e.target.value)}
                  placeholder={usePhone ? '08012345678' : 'you@example.com'}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-ink mb-2">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right -mt-2 mb-2">
              <span className="text-xs text-muted">Forgot your password? Contact support via WhatsApp.</span>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:text-primary-dark transition-colors">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
