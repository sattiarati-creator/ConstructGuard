import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { siteService } from '../services/siteService';
import { alertService } from '../services/alertService';
import { riskService } from '../services/riskService';
import {
  Site,
  RiskEvent,
  Alert,
  SensorReading,
  Detection,
} from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { AlertSeverityBadge, AlertStatusBadge } from '../components/AlertBadge';
import { ComponentScoresChart } from '../charts/ComponentScoresChart';
import { SensorLiveChart } from '../charts/SensorLiveChart';
import { joinSiteRoom, leaveSiteRoom, getSocket } from '../websocket/socketClient';
import { formatDateTime } from '../utils/formatters';
import {
  ArrowLeft,
  Clock,
  MapPin,
  FileCheck2,
  AlertOctagon,
  Eye,
  Activity,
  Layers,
  Cpu,
  CheckCircle,
  Camera,
} from 'lucide-react';

export const SiteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [site, setSite] = useState<Site | null>(null);
  const [latestRisk, setLatestRisk] = useState<RiskEvent | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [selectedSensorType, setSelectedSensorType] = useState<string>('vibration');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mocked/seeded visual detection frames for inspection
  const sampleDetections: Detection[] = [
    {
      id: 'det-1',
      image_id: 'img-latest',
      object_class: 'excavator',
      confidence: 0.94,
      bounding_box: { x_min: 0.15, y_min: 0.35, x_max: 0.65, y_max: 0.85 },
      detected_at: new Date().toISOString(),
    },
    {
      id: 'det-2',
      image_id: 'img-latest',
      object_class: 'truck',
      confidence: 0.88,
      bounding_box: { x_min: 0.68, y_min: 0.42, x_max: 0.92, y_max: 0.78 },
      detected_at: new Date().toISOString(),
    },
    {
      id: 'det-3',
      image_id: 'img-latest',
      object_class: 'person',
      confidence: 0.82,
      bounding_box: { x_min: 0.08, y_min: 0.60, x_max: 0.18, y_max: 0.88 },
      detected_at: new Date().toISOString(),
    },
  ];

  const fetchSiteData = async () => {
    if (!id) return;
    try {
      const [siteData, sensorData, riskData, alertData] = await Promise.all([
        siteService.getSite(id),
        siteService.getSiteSensors(id, 40),
        riskService.getRiskEvents({ siteId: id, limit: 10 }),
        alertService.getAlerts({ siteId: id, limit: 10 }),
      ]);

      setSite(siteData);
      setSensorReadings(sensorData || []);
      if (riskData && riskData.length > 0) {
        setLatestRisk(riskData[0]);
      }
      setAlerts(alertData || []);
    } catch (err) {
      console.error('Failed to fetch site inspection data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchSiteData();
    joinSiteRoom(id);

    const socket = getSocket();

    const handleSensorTick = (reading: SensorReading) => {
      if (reading.site_id === id) {
        setSensorReadings((prev) => [reading, ...prev.slice(0, 49)]);
      }
    };

    const handleRiskUpdate = (event: RiskEvent) => {
      if (event.site_id === id) {
        setLatestRisk(event);
      }
    };

    const handleAlertUpdate = () => {
      alertService.getAlerts({ siteId: id, limit: 10 }).then(setAlerts).catch(console.error);
    };

    socket.on('sensor.reading', handleSensorTick);
    socket.on('risk.created', handleRiskUpdate);
    socket.on('alert.created', handleAlertUpdate);
    socket.on('alert.acknowledged', handleAlertUpdate);
    socket.on('alert.resolved', handleAlertUpdate);

    return () => {
      leaveSiteRoom(id);
      socket.off('sensor.reading', handleSensorTick);
      socket.off('risk.created', handleRiskUpdate);
      socket.off('alert.created', handleAlertUpdate);
      socket.off('alert.acknowledged', handleAlertUpdate);
      socket.off('alert.resolved', handleAlertUpdate);
    };
  }, [id]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      setActionLoading(alertId);
      await alertService.acknowledgeAlert(alertId);
      await fetchSiteData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    const notes = prompt('Enter inspector resolution notes (required for audit):');
    if (!notes) return;
    try {
      setActionLoading(alertId);
      await alertService.resolveAlert(alertId, notes);
      await fetchSiteData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading site telemetry and visual data...</p>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-red-400">Site not found.</p>
        <Link to="/sites" className="mt-4 inline-block text-cyan-400 text-xs">
          &larr; Return to sites directory
        </Link>
      </div>
    );
  }

  const filteredSensors = sensorReadings.filter(
    (s) => s.sensor_type === selectedSensorType
  );

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          to="/sites"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-xs text-slate-500 font-mono">SITE #{site.id.slice(0, 8)}</span>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            {site.name}
            {latestRisk && (
              <RiskBadge level={latestRisk.risk_level} score={latestRisk.overall_score} />
            )}
          </h2>
        </div>
      </div>

      {/* Overview Site Header Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Location & Coordinates
          </span>
          <p className="text-sm font-semibold text-white">{site.address}</p>
          <p className="text-xs font-mono text-slate-400">
            {Number(site.latitude).toFixed(4)}, {Number(site.longitude).toFixed(4)}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
            Permit Authorization
          </span>
          <p
            className={`text-sm font-semibold ${
              site.authorized ? 'text-emerald-400' : 'text-red-400 font-bold'
            }`}
          >
            {site.authorized ? 'Permit Active' : 'NO VALID PERMIT'}
          </p>
          <p className="text-xs font-mono text-slate-400">
            {site.permit_number || 'BBMP-UNREGISTERED'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Permitted Work Hours
          </span>
          <p className="text-sm font-semibold text-white">
            {site.permitted_start_time || '08:00'} — {site.permitted_end_time || '18:00'}
          </p>
          <p className="text-xs text-slate-400">Strict nighttime curfew</p>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Risk Assessment
          </span>
          <p className="text-sm font-semibold text-white">
            {latestRisk ? `${latestRisk.overall_score.toFixed(1)} / 100` : 'N/A'}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {latestRisk?.explanation || 'Awaiting evaluation'}
          </p>
        </div>
      </div>

      {/* Grid: Computer Vision & Multi-factor Risk Scoring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Computer Vision & Object Detection Panel */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Computer Vision & Object Detection
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time YOLOv11 inference with bounding box overlays
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBoundingBoxes((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showBoundingBoxes
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showBoundingBoxes ? 'Bounding Boxes: ON' : 'Bounding Boxes: OFF'}
            </button>
          </div>

          {/* Visual Canvas Simulator */}
          <div className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Visual background placeholder simulating camera feed */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-600 select-none">
              <Camera className="w-12 h-12 mb-2 opacity-40 text-cyan-400" />
              <span className="text-xs tracking-wider uppercase font-mono">
                Site Camera Feed &bull; Live 1080p Stream
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-1">
                YOLOv11 TensorRT &bull; OpenCV Differencing Active
              </span>
            </div>

            {/* Bounding box overlays */}
            {showBoundingBoxes && (
              <div className="absolute inset-0 pointer-events-none">
                {sampleDetections.map((det) => {
                  const left = `${det.bounding_box.x_min * 100}%`;
                  const top = `${det.bounding_box.y_min * 100}%`;
                  const width = `${(det.bounding_box.x_max - det.bounding_box.x_min) * 100}%`;
                  const height = `${(det.bounding_box.y_max - det.bounding_box.y_min) * 100}%`;

                  return (
                    <div
                      key={det.id}
                      style={{ left, top, width, height }}
                      className="absolute border-2 border-cyan-400 bg-cyan-500/10 rounded"
                    >
                      <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-cyan-500 text-slate-950 font-bold text-[10px] rounded uppercase font-mono shadow">
                        {det.object_class} ({(det.confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detected Objects Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Heavy Machinery</span>
              <p className="text-sm font-bold text-cyan-400">1 Excavator, 1 Truck</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Personnel Detected</span>
              <p className="text-sm font-bold text-white">4 Workers (Night Shift)</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Change Area</span>
              <p className="text-sm font-bold text-amber-400">28.4% Frame Shift</p>
            </div>
          </div>
        </div>

        {/* Component Scores Breakdown */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Deterministic Risk Score Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Weighted explainable intelligence formula (Sum = 100 max)
            </p>
          </div>

          {latestRisk ? (
            <ComponentScoresChart
              visualScore={latestRisk.visual_score}
              changeScore={latestRisk.change_score}
              sensorScore={latestRisk.sensor_score}
              timeScore={latestRisk.time_score}
              permitScore={latestRisk.permit_score}
            />
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-500 text-xs">
              No component score data available.
            </div>
          )}

          {latestRisk?.indicators && latestRisk.indicators.length > 0 && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
                Active Risk Indicators:
              </span>
              <ul className="space-y-1">
                {latestRisk.indicators.map((ind, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-300 flex items-start gap-1.5"
                  >
                    <span className="text-amber-400 mt-0.5">&bull;</span>
                    <span>{ind}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* IoT Sensors Telemetry Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              IoT Sensor Telemetry Streams
            </h3>
            <p className="text-xs text-slate-400">
              Real-time MQTT telemetry readings published by edge sensor microcontrollers
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['vibration', 'noise', 'dust', 'motion', 'temperature'] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setSelectedSensorType(type)}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                    selectedSensorType === type
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>

        <SensorLiveChart
          readings={filteredSensors}
          sensorType={selectedSensorType}
        />
      </div>

      {/* Site Alerts & Operator Actions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400" />
              Operator Incident Actions for Site
            </h3>
            <p className="text-xs text-slate-400">
              Human inspector audit actions (Acknowledge and Resolve with notes)
            </p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No incidents reported for this site.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Severity</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Explanation</th>
                  <th className="pb-3 px-3">Timestamp</th>
                  <th className="pb-3 px-3 text-right">Inspector Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <AlertSeverityBadge severity={alert.severity} />
                    </td>
                    <td className="py-3 px-3">
                      <AlertStatusBadge status={alert.status} />
                    </td>
                    <td className="py-3 px-3 max-w-sm text-slate-300">
                      {alert.explanation || 'Threshold deviation detected'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {formatDateTime(alert.created_at)}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      {alert.status === 'OPEN' && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          disabled={actionLoading === alert.id}
                          className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors font-semibold"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={actionLoading === alert.id}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors font-semibold"
                        >
                          Resolve
                        </button>
                      )}
                      {alert.status === 'RESOLVED' && (
                        <span className="text-emerald-400 flex items-center justify-end gap-1 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
