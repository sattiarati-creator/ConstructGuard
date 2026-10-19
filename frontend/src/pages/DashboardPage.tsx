import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { alertService } from '../services/alertService';
import {
  DashboardSummary,
  RiskTrendItem,
  SiteSummaryItem,
  Alert,
} from '../types';
import { StatCard } from '../components/StatCard';
import { RiskBadge } from '../components/RiskBadge';
import { AlertSeverityBadge, AlertStatusBadge } from '../components/AlertBadge';
import { RiskTrendChart } from '../charts/RiskTrendChart';
import { SiteMap } from '../maps/SiteMap';
import { getSocket } from '../websocket/socketClient';
import {
  Building2,
  Camera,
  AlertTriangle,
  Flame,
  Activity,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<RiskTrendItem[]>([]);
  const [sites, setSites] = useState<SiteSummaryItem[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [sumRes, trendRes, siteRes, alertsRes] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getRiskTrends(),
        dashboardService.getSiteSummaries(),
        alertService.getAlerts({ status: 'OPEN', limit: 5 }),
      ]);

      setSummary(sumRes);
      setTrends(trendRes || []);
      setSites(siteRes || []);
      setRecentAlerts(alertsRes || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchData();
    };

    socket.on('risk.created', handleUpdate);
    socket.on('alert.created', handleUpdate);
    socket.on('alert.acknowledged', handleUpdate);
    socket.on('alert.resolved', handleUpdate);

    return () => {
      socket.off('risk.created', handleUpdate);
      socket.off('alert.created', handleUpdate);
      socket.off('alert.acknowledged', handleUpdate);
      socket.off('alert.resolved', handleUpdate);
    };
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading intelligence dashboard...</p>
      </div>
    );
  }

  // Sort sites descending by latestRiskScore to prioritize human inspection
  const prioritizedSites = [...sites].sort(
    (a, b) => (b.latestRiskScore || 0) - (a.latestRiskScore || 0)
  );

  return (
    <div className="space-y-6">
      {/* Top Header / Refresh Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Operational Overview & Risk Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-modal construction surveillance across municipal sectors
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Monitored Sites"
          value={summary?.totalSites ?? sites.length}
          icon={<Building2 className="w-5 h-5" />}
          subtitle="Active sensor zones"
        />
        <StatCard
          title="Active Cameras"
          value={summary?.activeCameras ?? 0}
          icon={<Camera className="w-5 h-5 text-cyan-400" />}
          subtitle="YOLO Vision nodes"
        />
        <StatCard
          title="Open Alerts"
          value={summary?.openAlerts ?? 0}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          variant={Number(summary?.openAlerts) > 0 ? 'warning' : 'default'}
          subtitle="Pending inspector review"
        />
        <StatCard
          title="Critical Alerts"
          value={summary?.criticalAlerts ?? 0}
          icon={<Flame className="w-5 h-5 text-red-400" />}
          variant={Number(summary?.criticalAlerts) > 0 ? 'critical' : 'default'}
          subtitle="Immediate triage required"
        />
        <StatCard
          title="Today's Events"
          value={summary?.todayEvents ?? 0}
          icon={<Activity className="w-5 h-5 text-indigo-400" />}
          subtitle="Scored risk evaluations"
        />
      </div>

      {/* Interactive Map & Trend Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Geographic Surveillance Map</h3>
              <p className="text-xs text-slate-400">Interactive telemetry pins color-coded by risk index</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Medium</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low</span>
            </div>
          </div>
          <SiteMap sites={sites} height="360px" />
        </div>

        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Risk Intelligence Trends</h3>
              <p className="text-xs text-slate-400">Peak vs average risk scores over recent cycles</p>
            </div>
          </div>
          <RiskTrendChart data={trends} />
        </div>
      </div>

      {/* Priority Sites for Human Inspection Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Inspection Priority Queue
            </h3>
            <p className="text-xs text-slate-400">
              Sites ranked deterministically by risk indicators for human inspector triage
            </p>
          </div>
          <Link
            to="/sites"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All Sites</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 px-3">Site Name & Location</th>
                <th className="pb-3 px-3">Permit Status</th>
                <th className="pb-3 px-3">Risk Assessment</th>
                <th className="pb-3 px-3">Key Risk Factors</th>
                <th className="pb-3 px-3">Open Alerts</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {prioritizedSites.slice(0, 5).map((site) => (
                <tr key={site.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white text-sm">{site.name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{site.address}</div>
                  </td>
                  <td className="py-3 px-3">
                    {site.authorized ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Valid Permit ({site.permit_number || 'OK'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 font-semibold bg-red-950/30 px-2 py-0.5 rounded border border-red-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        NO PERMIT RECORDED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <RiskBadge
                      level={site.latestRiskLevel || 'LOW'}
                      score={site.latestRiskScore}
                    />
                  </td>
                  <td className="py-3 px-3 max-w-xs text-slate-300 truncate">
                    {site.latestRiskExplanation || 'Normal baseline surveillance'}
                  </td>
                  <td className="py-3 px-3">
                    {site.openAlertCount > 0 ? (
                      <span className="px-2 py-0.5 rounded font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        {site.openAlertCount} OPEN
                      </span>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/sites/${site.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 font-medium transition-colors"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Urgent Operator Action Feed</h3>
            <p className="text-xs text-slate-400">Real-time alerts requiring human acknowledgment</p>
          </div>
          <Link
            to="/alerts"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>All Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No active open alerts. All monitored sites within normal parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[150px]">
                    {alert.site_name || 'Monitored Site'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <AlertSeverityBadge severity={alert.severity} />
                    <AlertStatusBadge status={alert.status} />
                  </div>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {alert.explanation || 'Anomaly threshold exceeded'}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>{formatDateTime(alert.created_at)}</span>
                  <Link
                    to="/alerts"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    Take Action &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
