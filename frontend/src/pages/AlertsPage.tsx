import React, { useState, useEffect } from 'react';
import { alertService } from '../services/alertService';
import { Alert } from '../types';
import { AlertSeverityBadge, AlertStatusBadge } from '../components/AlertBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../auth/AuthContext';
import { getSocket } from '../websocket/socketClient';
import { formatDateTime } from '../utils/formatters';
import {
  AlertTriangle,
  CheckCircle,
  Search,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Resolve modal state
  const [resolveModalAlert, setResolveModalAlert] = useState<Alert | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { user } = useAuth();
  const canTakeAction = user?.role === 'ADMIN' || user?.role === 'INSPECTOR';

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const data = await alertService.getAlerts(params);
      setAlerts(data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    const socket = getSocket();
    const handleAlertChange = () => {
      loadAlerts();
    };

    socket.on('alert.created', handleAlertChange);
    socket.on('alert.acknowledged', handleAlertChange);
    socket.on('alert.resolved', handleAlertChange);

    return () => {
      socket.off('alert.created', handleAlertChange);
      socket.off('alert.acknowledged', handleAlertChange);
      socket.off('alert.resolved', handleAlertChange);
    };
  }, [severityFilter, statusFilter]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setActionLoading(alertId);
      await alertService.acknowledgeAlert(alertId);
      await loadAlerts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to acknowledge alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalAlert || !resolveNotes.trim()) return;

    try {
      setActionLoading(resolveModalAlert.id);
      await alertService.resolveAlert(resolveModalAlert.id, resolveNotes);
      setResolveModalAlert(null);
      setResolveNotes('');
      await loadAlerts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to resolve alert');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const site = alert.site_name || '';
    const expl = alert.explanation || '';
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
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Operator Alert Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Triage queue for indicators of potentially unauthorized construction
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search alerts by site name or indicator text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN Only</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          No alerts match the selected criteria.
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/40">
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Site Location</th>
                  <th className="py-3 px-4">Detected Indicators</th>
                  <th className="py-3 px-4">Detected At</th>
                  <th className="py-3 px-4 text-right">Human Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <AlertSeverityBadge severity={alert.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <AlertStatusBadge status={alert.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-sm">
                        {alert.site_name || 'Monitored Site'}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        ALERT-{alert.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md text-slate-300">
                      <p className="line-clamp-2 leading-relaxed">
                        {alert.explanation || 'Anomalous activity threshold exceeded'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(alert.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {canTakeAction ? (
                        <div className="flex items-center justify-end gap-2">
                          {alert.status === 'OPEN' && (
                            <button
                              onClick={() => handleAcknowledge(alert.id)}
                              disabled={actionLoading === alert.id}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors font-semibold"
                            >
                              Acknowledge
                            </button>
                          )}

                          {alert.status !== 'RESOLVED' && (
                            <button
                              onClick={() => {
                                setResolveModalAlert(alert);
                                setResolveNotes('');
                              }}
                              disabled={actionLoading === alert.id}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors font-semibold"
                            >
                              Resolve
                            </button>
                          )}

                          {alert.status === 'RESOLVED' && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Resolved
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">
                          Viewer Read-Only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Resolve Alert with Inspector Audit Notes */}
      <Modal
        isOpen={!!resolveModalAlert}
        onClose={() => setResolveModalAlert(null)}
        title="Resolve Operator Alert & Record Audit"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400">Site:</span>{' '}
            <span className="font-semibold text-white">
              {resolveModalAlert?.site_name || 'Site'}
            </span>
            <div className="text-slate-300 text-[11px] mt-1">
              {resolveModalAlert?.explanation}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Inspector Resolution Notes (Required for Audit Trail)
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Inspector Sharma visited site. Verified emergency water pipe repair work with valid temporary municipal variance. No unauthorized structural expansion."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setResolveModalAlert(null)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading === resolveModalAlert?.id || !resolveNotes.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? 'Recording...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
