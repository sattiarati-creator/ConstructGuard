import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Shield, Radio, LogOut, ExternalLink, Menu } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isConnected = true }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              ConstructGuard
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 rounded-full">
                Intelligence
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Unauthorized Construction Risk Monitoring System
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time WebSocket connection status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 border border-slate-700/60">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-slate-300 hidden md:inline">
            {isConnected ? 'Telemetry Live' : 'Disconnected'}
          </span>
          <Radio className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* API Docs Link */}
        <a
          href="/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <span>Swagger API</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* User Info & Role */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user.name}</div>
              <div className="text-[10px] text-cyan-400 font-mono">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
