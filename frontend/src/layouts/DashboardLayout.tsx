import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { getSocket } from '../websocket/socketClient';
import { AlertCircle, X } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [realtimeToast, setRealtimeToast] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'critical' | 'warning' | 'info';
  } | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleAlertCreated = (data: any) => {
      setRealtimeToast({
        id: String(Date.now()),
        title: `🚨 ${data.severity || 'HIGH'} ALERT TRIGGERED`,
        message: data.explanation || `Site ${data.site_name || ''} exceeded risk threshold`,
        type: data.severity === 'CRITICAL' ? 'critical' : 'warning',
      });
    };

    const handleRiskCreated = (data: any) => {
      if (data.risk_level === 'CRITICAL' || data.risk_level === 'HIGH') {
        setRealtimeToast({
          id: String(Date.now()),
          title: `Risk Escalation: ${data.risk_level} (${data.overall_score || data.score}%)`,
          message: data.explanation || 'Elevated unauthorized construction activity detected',
          type: 'warning',
        });
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('alert.created', handleAlertCreated);
    socket.on('risk.created', handleRiskCreated);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('alert.created', handleAlertCreated);
      socket.off('risk.created', handleRiskCreated);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isConnected={isConnected}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Real-time Toast Alert */}
          {realtimeToast && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all ${
                realtimeToast.type === 'critical'
                  ? 'bg-red-950/90 border-red-500/50 text-red-200'
                  : 'bg-amber-950/90 border-amber-500/50 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">{realtimeToast.title}</h4>
                  <p className="text-xs opacity-90">{realtimeToast.message}</p>
                </div>
              </div>
              <button
                onClick={() => setRealtimeToast(null)}
                className="p-1 rounded-lg hover:bg-black/20"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Decision Support Disclaimer */}
          <DisclaimerBanner />

          {/* Child Page Content */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
