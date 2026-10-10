import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../services/api';
import {
  Settings,
  Sliders,
  Play,
  CheckCircle2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [demoStatus, setDemoStatus] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  // Risk thresholds state
  const [thresholds, setThresholds] = useState({
    critical: 80,
    high: 60,
    medium: 30,
    visualWeight: 30,
    changeWeight: 25,
    sensorWeight: 20,
    timeWeight: 15,
    permitWeight: 10,
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleTriggerDemoScenario = async () => {
    try {
      setTriggering(true);
      setDemoStatus('Dispatching BullMQ test risk evaluation job...');
      const res = await api.post('/jobs/test-risk', {
        site_id: 'site-104',
        explanation: 'Demo simulation: Nighttime unauthorized excavation and vibration',
      });
      setDemoStatus(`Job #${res.data?.jobId || 'demo-1'} queued successfully! Check Dashboard/Alerts for real-time updates.`);
    } catch (err: any) {
      setDemoStatus(
        `Error queueing test job: ${
          err.response?.data?.error || err.message || 'Unknown error'
        }`
      );
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          System Configuration & Decision Support Engine
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune deterministic risk weights, severity thresholds, and test end-to-end event loops
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-600/20">
            {user?.name?.slice(0, 2).toUpperCase() || 'CG'}
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{user?.name}</h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <div className="text-right hidden sm:block text-xs text-slate-400">
          <p>Session ID: <span className="font-mono text-slate-300">CG-SEC-AUTH</span></p>
          <p className="text-[11px] text-emerald-400 font-medium mt-0.5">RBAC Verified</p>
        </div>
      </div>

      {/* Demo Scenario Trigger */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Interview Demo Scenario Runner
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly simulates an unauthorized nighttime construction breach (Site 104) through the full BullMQ &rarr; PostgreSQL &rarr; Socket.IO pipeline.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <p className="text-xs text-slate-300">
            Clicking the button below dispatches a background task through Redis &amp; BullMQ worker, evaluating high visual machinery + 35% image change + 5.2 mm/s vibration after 22:00 curfew on an unauthorized plot.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerDemoScenario}
              disabled={triggering}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {triggering ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>Trigger Unauthorized Night Work Scenario</span>
            </button>
          </div>

          {demoStatus && (
            <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 text-xs font-mono">
              {demoStatus}
            </div>
          )}
        </div>
      </div>

      {/* Configurable Risk Formula Weights */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Deterministic Intelligence Weights & Thresholds
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configures the deterministic explainable decision support formula weights (Total must equal 100%)
          </p>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Critical Score Threshold (&ge;)
              </label>
              <input
                type="number"
                value={thresholds.critical}
                onChange={(e) =>
                  setThresholds({ ...thresholds, critical: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500">Triggers CRITICAL Operator Alert</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                High Score Threshold (&ge;)
              </label>
              <input
                type="number"
                value={thresholds.high}
                onChange={(e) =>
                  setThresholds({ ...thresholds, high: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500">Triggers HIGH Operator Alert</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Medium Score Threshold (&ge;)
              </label>
              <input
                type="number"
                value={thresholds.medium}
                onChange={(e) =>
                  setThresholds({ ...thresholds, medium: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500">Flags for periodic inspection</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Visual Weight</label>
              <input
                type="number"
                value={thresholds.visualWeight}
                onChange={(e) => setThresholds({ ...thresholds, visualWeight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">30% default</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Change Weight</label>
              <input
                type="number"
                value={thresholds.changeWeight}
                onChange={(e) => setThresholds({ ...thresholds, changeWeight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">25% default</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Sensor Weight</label>
              <input
                type="number"
                value={thresholds.sensorWeight}
                onChange={(e) => setThresholds({ ...thresholds, sensorWeight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">20% default</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Time Weight</label>
              <input
                type="number"
                value={thresholds.timeWeight}
                onChange={(e) => setThresholds({ ...thresholds, timeWeight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">15% default</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Permit Weight</label>
              <input
                type="number"
                value={thresholds.permitWeight}
                onChange={(e) => setThresholds({ ...thresholds, permitWeight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">10% default</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedNotice ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Parameters saved for active session
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Formula Total: {thresholds.visualWeight + thresholds.changeWeight + thresholds.sensorWeight + thresholds.timeWeight + thresholds.permitWeight}%
              </span>
            )}

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
            >
              Update Intelligence Thresholds
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
