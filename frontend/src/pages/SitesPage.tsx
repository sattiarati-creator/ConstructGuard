import React, { useState, useEffect } from 'react';
import { siteService } from '../services/siteService';
import { dashboardService } from '../services/dashboardService';
import { SiteSummaryItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  ArrowRight,
  Clock,
  MapPin,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

export const SitesPage: React.FC = () => {
  const [sites, setSites] = useState<SiteSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [authFilter, setAuthFilter] = useState<'ALL' | 'AUTHORIZED' | 'UNAUTHORIZED'>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // New site modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 12.9716,
    longitude: 77.5946,
    authorized: false,
    permit_number: '',
    permit_start_date: '',
    permit_end_date: '',
    permitted_start_time: '08:00:00',
    permitted_end_time: '18:00:00',
  });

  const { user } = useAuth();
  const canManageSites = user?.role === 'ADMIN' || user?.role === 'INSPECTOR';

  const loadSites = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getSiteSummaries();
      setSites(data || []);
    } catch (err) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await siteService.createSite({
        ...formData,
        permit_number: formData.authorized ? formData.permit_number : undefined,
      });
      setIsModalOpen(false);
      // Reset form
      setFormData({
        name: '',
        address: '',
        latitude: 12.9716,
        longitude: 77.5946,
        authorized: false,
        permit_number: '',
        permit_start_date: '',
        permit_end_date: '',
        permitted_start_time: '08:00:00',
        permitted_end_time: '18:00:00',
      });
      await loadSites();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create site');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (site.permit_number &&
        site.permit_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAuth =
      authFilter === 'ALL' ||
      (authFilter === 'AUTHORIZED' && site.authorized) ||
      (authFilter === 'UNAUTHORIZED' && !site.authorized);

    const matchesRisk =
      riskFilter === 'ALL' || site.latestRiskLevel === riskFilter;

    return matchesSearch && matchesAuth && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Monitored Construction Sites
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registry of active surveillance locations, permits, and risk posture
          </p>
        </div>

        {canManageSites && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Site</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by site name, address, or permit #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={authFilter}
            onChange={(e) => setAuthFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Permit Statuses</option>
            <option value="AUTHORIZED">Authorized Only</option>
            <option value="UNAUTHORIZED">Unauthorized / No Permit</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          No construction sites found matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">
                      {site.name}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                      <span className="truncate max-w-[200px]">{site.address}</span>
                    </div>
                  </div>
                  <RiskBadge
                    level={site.latestRiskLevel || 'LOW'}
                    score={site.latestRiskScore}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                      Permit Status:
                    </span>
                    {site.authorized ? (
                      <span className="font-semibold text-emerald-400">
                        Authorized ({site.permit_number || 'Valid'})
                      </span>
                    ) : (
                      <span className="font-semibold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-800/50">
                        NO PERMIT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Permitted Hours:
                    </span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {site.permitted_start_time || '08:00'} -{' '}
                      {site.permitted_end_time || '18:00'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                      Open Alerts:
                    </span>
                    <span
                      className={`font-semibold ${
                        site.openAlertCount > 0 ? 'text-red-400' : 'text-slate-500'
                      }`}
                    >
                      {site.openAlertCount > 0 ? `${site.openAlertCount} Active` : '0'}
                    </span>
                  </div>

                  <div className="pt-2 text-slate-400 text-[11px]">
                    <span className="font-medium text-slate-300">Latest Reason:</span>{' '}
                    <span className="italic">
                      {site.latestRiskExplanation || 'Within acceptable tolerance'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {Number(site.latitude).toFixed(4)}, {Number(site.longitude).toFixed(4)}
                </span>
                <Link
                  to={`/sites/${site.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors"
                >
                  <span>Inspection View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Register New Site */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Construction Site"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSite} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Site Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Whitefield Metro Phase 3 Extension"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Address / Locality
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ITPL Main Road, Whitefield, Bangalore"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: parseFloat(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: parseFloat(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.authorized}
                onChange={(e) =>
                  setFormData({ ...formData, authorized: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-800 text-cyan-600 focus:ring-0 bg-slate-950"
              />
              <span className="text-xs font-semibold text-slate-200">
                Site has valid municipal construction permit
              </span>
            </label>
          </div>

          {formData.authorized && (
            <div className="space-y-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Permit Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. BBMP/COMM/2026/8942"
                  value={formData.permit_number}
                  onChange={(e) =>
                    setFormData({ ...formData, permit_number: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Permitted Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.permitted_start_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permitted_start_time: e.target.value + ':00',
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Permitted End Time
                  </label>
                  <input
                    type="time"
                    value={formData.permitted_end_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permitted_end_time: e.target.value + ':00',
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Site'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
