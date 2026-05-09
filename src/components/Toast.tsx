import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const ICONS = {
  success: <CheckCircle size={18} className="text-green-500 shrink-0" />,
  error:   <XCircle    size={18} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
  info:    <Info       size={18} className="text-blue-500 shrink-0" />,
};

const BORDERS = {
  success: 'border-green-200 bg-green-50',
  error:   'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info:    'border-blue-200 bg-blue-50',
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto animate-in slide-in-from-right-8 duration-300 ${BORDERS[toast.type]}`}
        >
          {ICONS[toast.type]}
          <p className="text-sm text-gray-800 flex-1 font-medium">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
