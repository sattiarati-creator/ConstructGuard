import React, { useState, useEffect } from 'react';
import { siteService } from '../services/siteService';
import { sensorService } from '../services/sensorService';
import { Site, SensorReading } from '../types';
import { SensorLiveChart } from '../charts/SensorLiveChart';
import { getSocket } from '../websocket/socketClient';
import {
  Cpu,
  Activity,
  Volume2,
  Wind,
  Thermometer,
  Zap,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SensorsPage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [latestSensors, setLatestSensors] = useState<Record<string, SensorReading>>({});
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [selectedType, setSelectedType] = useState<string>('vibration');
  const [loading, setLoading] = useState(true);

  // Thresholds for anomaly detection
  const thresholds: Record<string, { max: number; unit: string; icon: any }> = {
    vibration: { max: 4.5, unit: 'mm/s', icon: Zap },
    noise: { max: 75.0, unit: 'dBA', icon: Volume2 },
    dust: { max: 150.0, unit: 'µg/m³', icon: Wind },
    motion: { max: 1.0, unit: 'state', icon: Activity },
    temperature: { max: 42.0, unit: '°C', icon: Thermometer },
  };

  const loadInitialSites = async () => {
    try {
      setLoading(true);
      const siteList = await siteService.getSites();
      setSites(siteList || []);
      if (siteList && siteList.length > 0) {
        setSelectedSiteId(siteList[0].id);
      }
    } catch (err) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSiteSensors = async (siteId: string) => {
    if (!siteId) return;
    try {
      const [latestRes, historyRes] = await Promise.all([
        sensorService.getLatestSensors(siteId),
        sensorService.getSiteSensors(siteId, { limit: 50 }),
      ]);
      setLatestSensors(latestRes?.sensors || {});
      setReadings(historyRes || []);
    } catch (err) {
      console.error('Failed to load sensor telemetry:', err);
    }
  };

  useEffect(() => {
    loadInitialSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      loadSiteSensors(selectedSiteId);
    }

    const socket = getSocket();
    const handleReading = (reading: SensorReading) => {
      if (reading.site_id === selectedSiteId) {
        setLatestSensors((prev) => ({ ...prev, [reading.sensor_type]: reading }));
        setReadings((prev) => [reading, ...prev.slice(0, 99)]);
      }
    };

    socket.on('sensor.reading', handleReading);

    return () => {
      socket.off('sensor.reading', handleReading);
    };
  }, [selectedSiteId]);

  const selectedSite = sites.find((s) => s.id === selectedSiteId);
  const filteredReadings = readings.filter((r) => r.sensor_type === selectedType);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            IoT Sensor Telemetry Mesh
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Distributed environmental and structural vibration telemetry over MQTT / Mosquitto
          </p>
        </div>

        {/* Site selector */}
        <div className="w-full sm:w-72">
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sensor Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {(['vibration', 'noise', 'dust', 'motion', 'temperature'] as const).map(
          (type) => {
            const info = thresholds[type];
            const Icon = info.icon;
            const reading = latestSensors[type];
            const val = reading ? Number(reading.value) : 0;
            const isAnomaly = val > info.max;

            return (
              <div
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedType === type
                    ? 'border-cyan-500 bg-slate-900 shadow-md shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase">
                    {type}
                  </span>
                  <div
                    className={`p-1.5 rounded-lg ${
                      isAnomaly
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-800 text-cyan-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white">
                    {reading ? val.toFixed(1) : '--'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {reading?.unit || info.unit}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Threshold: {info.max}</span>
                  {isAnomaly ? (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> ANOMALY
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Normal
                    </span>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Selected Sensor Detailed Chart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white capitalize">
              {selectedType} Continuous Stream &mdash; {selectedSite?.name || 'Selected Site'}
            </h3>
            <p className="text-xs text-slate-400">
              Timeseries telemetry received via MQTT broker topic: constructguard/sites/
              {selectedSiteId}/sensors/{selectedType}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-800/40">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Broker: Mosquitto 1883</span>
          </div>
        </div>

        <SensorLiveChart readings={filteredReadings} sensorType={selectedType} />
      </div>
    </div>
  );
};
