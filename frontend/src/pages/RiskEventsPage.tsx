import React, { useState, useEffect } from 'react';
import { riskService } from '../services/riskService';
import { RiskEvent } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { Modal } from '../components/Modal';
import { formatDateTime } from '../utils/formatters';
import {
  Activity,
  Calculator,
  Search,
} from 'lucide-react';

export const RiskEventsPage: React.FC = () => {
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Simulator Modal State
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [simForm, setSimForm] = useState({
    visualScore: 80,
    changeScore: 70,
    sensorScore: 85,
    timeScore: 90,
    permitScore: 100,
  });
  const [simResult, setSimResult] = useState<any>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (levelFilter !== 'ALL') params.riskLevel = levelFilter;
      const data = await riskService.getRiskEvents(params);
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load risk events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [levelFilter]);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    // Deterministic formula computation:
    // overall = visual*0.3 + change*0.25 + sensor*0.2 + time*0.15 + permit*0.1
    const v = Number(simForm.visualScore);
    const c = Number(simForm.changeScore);
    const s = Number(simForm.sensorScore);
    const t = Number(simForm.timeScore);
    const p = Number(simForm.permitScore);

    const overall = v * 0.3 + c * 0.25 + s * 0.2 + t * 0.15 + p * 0.1;
    let level = 'LOW';
    if (overall >= 80) level = 'CRITICAL';
    else if (overall >= 60) level = 'HIGH';
    else if (overall >= 30) level = 'MEDIUM';

    setSimResult({
      visualScore: v,
      changeScore: c,
      sensorScore: s,
      timeScore: t,
      permitScore: p,
      overallScore: Number(overall.toFixed(1)),
      riskLevel: level,
    });
  };

  const filteredEvents = events.filter((ev) => {
    const site = ev.site_name || '';
    const expl = ev.explanation || '';
    return (
      site.toLowerCase().includes(search.toLowerCase()) ||
      expl.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Risk Intelligence Evaluations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit log of all deterministic multi-sensor risk calculations
          </p>
        </div>

        <button
          onClick={() => {
            setIsSimModalOpen(true);
            setSimResult(null);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-white shadow transition-all"
        >
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span>Interactive Formula Simulator</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="sm:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search risk evaluations by site or explanation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Only (Score &gt;= 80)</option>
            <option value="HIGH">High Only (Score 60-79)</option>
            <option value="MEDIUM">Medium Only (Score 30-59)</option>
            <option value="LOW">Low Only (Score &lt; 30)</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          No risk evaluation events recorded.
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="py-3 px-4">Evaluation Level</th>
                  <th className="py-3 px-4">Site Location</th>
                  <th className="py-3 px-4">Multi-factor Breakdown</th>
                  <th className="py-3 px-4">Deterministic Explanation</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RiskBadge level={ev.risk_level} score={ev.overall_score} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm">
                        {ev.site_name || 'Monitored Site'}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        EVENT-{ev.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] min-w-[280px]">
                        <span className="p-1 bg-slate-950 rounded border border-slate-800">
                          Vis: <b className="text-sky-400">{ev.visual_score}</b>
                        </span>
                        <span className="p-1 bg-slate-950 rounded border border-slate-800">
                          Chg: <b className="text-indigo-400">{ev.change_score}</b>
                        </span>
                        <span className="p-1 bg-slate-950 rounded border border-slate-800">
                          Sen: <b className="text-amber-400">{ev.sensor_score}</b>
                        </span>
                        <span className="p-1 bg-slate-950 rounded border border-slate-800">
                          Tim: <b className="text-orange-400">{ev.time_score}</b>
                        </span>
                        <span className="p-1 bg-slate-950 rounded border border-slate-800">
                          Per: <b className="text-red-400">{ev.permit_score}</b>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm text-slate-300">
                      <p className="line-clamp-2">{ev.explanation}</p>
                      {ev.indicators && ev.indicators.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ev.indicators.map((ind, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700/60"
                            >
                              {ind}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(ev.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      <Modal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        title="Deterministic Risk Engine Simulator"
        maxWidth="lg"
      >
        <form onSubmit={handleSimulate} className="space-y-4">
          <p className="text-xs text-slate-400">
            Adjust individual component scores (0 - 100) to test how the explainable weighted formula computes the combined risk index.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Visual Detection (30% weight)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={simForm.visualScore}
                onChange={(e) =>
                  setSimForm({ ...simForm, visualScore: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Change Detection (25% weight)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={simForm.changeScore}
                onChange={(e) =>
                  setSimForm({ ...simForm, changeScore: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                IoT Sensor Telemetry (20% weight)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={simForm.sensorScore}
                onChange={(e) =>
                  setSimForm({ ...simForm, sensorScore: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Time Window Compliance (15% weight)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={simForm.timeScore}
                onChange={(e) =>
                  setSimForm({ ...simForm, timeScore: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Permit Validity (10% weight)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={simForm.permitScore}
                onChange={(e) =>
                  setSimForm({ ...simForm, permitScore: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-all"
          >
            Compute Deterministic Score
          </button>

          {simResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold uppercase">
                  Calculated Result:
                </span>
                <RiskBadge
                  level={simResult.riskLevel}
                  score={simResult.overallScore}
                />
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Formula: ({simResult.visualScore} &times; 0.3) + ({simResult.changeScore} &times; 0.25) + ({simResult.sensorScore} &times; 0.2) + ({simResult.timeScore} &times; 0.15) + ({simResult.permitScore} &times; 0.1) = <b className="text-cyan-400">{simResult.overallScore}</b>
              </p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};
