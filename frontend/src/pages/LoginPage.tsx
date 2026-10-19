import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Shield, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@constructguard.local');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDevPillClick = (devEmail: string, devPass: string) => {
    setEmail(devEmail);
    setPassword(devPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-2xl shadow-xl shadow-cyan-500/20 text-white mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            ConstructGuard Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Unauthorized Construction Monitoring & Risk Intelligence Platform
          </p>
        </div>

        <DisclaimerBanner />

        {/* Development 1-click test credentials selector */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Quick 1-Click Dev Logins:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                handleDevPillClick('admin@constructguard.local', 'Admin@123')
              }
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                email === 'admin@constructguard.local'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() =>
                handleDevPillClick('inspector@constructguard.local', 'Inspector@123')
              }
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                email === 'inspector@constructguard.local'
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              🔍 Inspector
            </button>
            <button
              type="button"
              onClick={() =>
                handleDevPillClick('viewer@constructguard.local', 'Viewer@123')
              }
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                email === 'viewer@constructguard.local'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              👀 Viewer
            </button>
          </div>
        </div>

        {/* Login form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="admin@constructguard.local"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Enter System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-500">
          ConstructGuard Enterprise Edition &bull; RBAC Protected
        </div>
      </div>
    </div>
  );
};
