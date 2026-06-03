import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Eye, EyeOff, Store, ArrowRight, AlertCircle, Check } from 'lucide-react';

const PERKS = [
  'Order from 20+ Lagos markets',
  'Book vetted artisans instantly',
  'Live order tracking',
  'Exclusive promo codes',
];

export default function Register() {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ phone: form.phone, email: form.email || undefined, password: form.password, fullName: form.fullName });
      navigate('/');
    } catch (err) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = form.password.length >= 8 ? (
    /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 'strong' : 'medium'
  ) : form.password.length > 0 ? 'weak' : '';

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background-light">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
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

          <h1 className="text-3xl font-black text-ink tracking-tight mb-2">Create your account</h1>
          <p className="text-muted text-sm mb-8">Join thousands of Lagos shoppers today.</p>

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
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-ink mb-2">Full name <span className="text-red-500">*</span></label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={set('fullName')}
                  placeholder="Ade Babatunde"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-ink mb-2">Phone number <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="08012345678"
                  required
                  minLength={7}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-ink mb-2">Email address <span className="text-muted text-[11px] font-normal">(optional)</span></label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-ink mb-2">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="8+ characters"
                  required
                  minLength={8}
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

              {/* Strength bar */}
              {pwStrength && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex gap-1">
                  {['weak', 'medium', 'strong'].map((level, i) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        ['weak', 'medium', 'strong'].indexOf(pwStrength) >= i
                          ? pwStrength === 'strong' ? 'bg-primary'
                          : pwStrength === 'medium' ? 'bg-amber-400'
                          : 'bg-red-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-muted ml-2 capitalize">{pwStrength}</span>
                </motion.div>
              )}
            </div>

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
                <>Create Account <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:text-primary-dark transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden mesh-bg-dark flex-col items-center justify-center p-16">
        <div className="absolute top-0 left-0 size-96 bg-primary/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 size-72 bg-accent/15 rounded-full blur-3xl" />
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
          className="relative z-10 max-w-sm text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="size-12 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-xl shadow-primary/40">
              <Store size={24} className="text-white" />
            </div>
            <span className="text-white text-2xl font-black tracking-tight">
              Ayanfe<span className="text-primary" style={{ filter: 'brightness(1.6)' }}>.</span>
            </span>
          </div>

          <h2 className="text-3xl font-black text-white mb-6 leading-tight">
            Everything you need,<br />delivered from Lagos.
          </h2>

          <div className="text-left space-y-4 mt-8">
            {PERKS.map((perk, i) => (
              <motion.div
                key={perk}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 px-4 py-3 glass-dark rounded-2xl"
              >
                <div className="size-6 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-primary" style={{ filter: 'brightness(1.6)' }} />
                </div>
                <span className="text-sm font-medium text-white/80">{perk}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
