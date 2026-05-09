import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
    const [role] = useState('customer'); // Default role
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ email, password, role });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Create Account</h2>
        
        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="you@example.com"
                    required
                />
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    required
                />
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-orange-500/30 hover:scale-[1.02] transition-all duration-200"
          >
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-orange-600 font-semibold hover:text-orange-700">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
