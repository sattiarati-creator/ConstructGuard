import React, { useState, useEffect } from 'react';
import { cameraService } from '../services/cameraService';
import { siteService } from '../services/siteService';
import { Camera, Site } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import {
  Camera as CameraIcon,
  Plus,
  ExternalLink,
  Building2,
  Video,
} from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export const CamerasPage: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteFilter, setSiteFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    site_id: '',
    name: '',
    stream_url: 'rtsp://stream.constructguard.local/live/cam-01',
  });

  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'INSPECTOR';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cams, sitesData] = await Promise.all([
        cameraService.getCameras(),
        siteService.getSites(),
      ]);
      setCameras(cams || []);
      setSites(sitesData || []);
      if (sitesData && sitesData.length > 0 && !formData.site_id) {
        setFormData((prev) => ({ ...prev, site_id: sitesData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load cameras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await cameraService.createCamera(formData);
      setIsModalOpen(false);
      setFormData({
        site_id: sites[0]?.id || '',
        name: '',
        stream_url: 'rtsp://stream.constructguard.local/live/cam-01',
      });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to register camera');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchesSite = siteFilter === 'ALL' || cam.site_id === siteFilter;
    const matchesStatus = statusFilter === 'ALL' || cam.status === statusFilter;
    return matchesSite && matchesStatus;
  });

  const getSiteName = (siteId: string) => {
    const s = sites.find((site) => site.id === siteId);
    return s ? s.name : 'Unknown Site';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-cyan-400" />
            Active Surveillance Cameras
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Edge RTSP optical feeds supplying continuous frames to YOLO inference pipeline
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Camera</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Monitored Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Camera Statuses</option>
            <option value="ONLINE">ONLINE Only</option>
            <option value="OFFLINE">OFFLINE Only</option>
          </select>
        </div>
      </div>

      {/* Camera Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
          No camera feeds matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCameras.map((camera) => (
            <div
              key={camera.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              {/* Stream Frame Mockup */}
              <div className="relative aspect-video bg-slate-950 flex flex-col items-center justify-center text-slate-600 border-b border-slate-800">
                <Video className="w-10 h-10 mb-1 opacity-50 text-cyan-400" />
                <span className="text-[10px] font-mono tracking-wider text-slate-400">
                  {camera.status === 'ONLINE' ? 'LIVE FEED (1080p @ 30fps)' : 'FEED OFFLINE'}
                </span>

                {/* Status pill on video */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/90 border border-slate-700/80">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      camera.status === 'ONLINE'
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-red-400'
                    }`}
                  />
                  <span
                    className={
                      camera.status === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'
                    }
                  >
                    {camera.status}
                  </span>
                </div>
              </div>

              {/* Camera Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm truncate">{camera.name}</h3>
                  <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{getSiteName(camera.site_id)}</span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="text-slate-500 font-mono text-[10px] truncate">
                      RTSP: {camera.stream_url}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Last Frame: {formatDateTime(camera.last_seen_at || camera.created_at)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {camera.id.slice(0, 8)}
                  </span>
                  <Link
                    to={`/sites/${camera.site_id}`}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>Inspect Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Register Camera */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Camera Node"
      >
        <form onSubmit={handleCreateCamera} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Site Location
            </label>
            <select
              required
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Camera Identifier Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. North Gate PTZ Camera 01"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              RTSP / HLS Stream URI
            </label>
            <input
              type="text"
              required
              placeholder="rtsp://admin:pass@192.168.1.100:554/live"
              value={formData.stream_url}
              onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

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
              {submitting ? 'Registering...' : 'Register Camera'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
