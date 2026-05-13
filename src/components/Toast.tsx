import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const CONFIGS: Record<ToastType, { icon: React.ReactNode; bar: string; bg: string }> = {
  success: {
    icon: <CheckCircle size={17} className="text-emerald-500 shrink-0" />,
    bar: 'bg-emerald-400',
    bg: 'bg-white border-emerald-100',
  },
  error: {
    icon: <XCircle size={17} className="text-red-500 shrink-0" />,
    bar: 'bg-red-400',
    bg: 'bg-white border-red-100',
  },
  warning: {
    icon: <AlertTriangle size={17} className="text-amber-500 shrink-0" />,
    bar: 'bg-amber-400',
    bg: 'bg-white border-amber-100',
  },
  info: {
    icon: <Info size={17} className="text-blue-500 shrink-0" />,
    bar: 'bg-blue-400',
    bg: 'bg-white border-blue-100',
  },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-[360px] w-full pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map(toast => {
          const cfg = CONFIGS[toast.type as ToastType] ?? CONFIGS.info;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className={`relative overflow-hidden flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl shadow-black/8 pointer-events-auto ${cfg.bg}`}
            >
              {/* Left accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-2xl`} />

              <div className="pl-1">{cfg.icon}</div>
              <p className="text-sm text-ink flex-1 font-medium leading-snug">{toast.message}</p>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-muted hover:text-ink transition-colors mt-0.5 shrink-0"
              >
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
