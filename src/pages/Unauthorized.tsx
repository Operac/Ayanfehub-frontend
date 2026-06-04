import { useNavigate } from 'react-router-dom';
import { ShieldOff, Home, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        {/* Icon */}
        <div className="mx-auto mb-6 size-20 rounded-3xl bg-red-50 flex items-center justify-center">
          <ShieldOff size={36} className="text-red-400" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-black text-ink mb-3">Access Denied</h1>
        <p className="text-muted mb-8">
          {user
            ? "You don't have permission to view this page. This area is restricted to authorised roles only."
            : "You need to be signed in to access this page."}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-ink font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
          >
            <Home size={16} />
            Go Home
          </button>
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-dark transition-colors"
            >
              <LogIn size={16} />
              Sign In
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
