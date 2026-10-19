import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SiteSummaryItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { Link } from 'react-router-dom';

interface SiteMapProps {
  sites: SiteSummaryItem[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  selectedSiteId?: string;
}

// Function to generate customized SVG marker icons matching risk levels
const createRiskIcon = (riskLevel: string = 'LOW') => {
  let color = '#10b981'; // LOW = emerald
  let pulse = false;

  switch (riskLevel) {
    case 'CRITICAL':
      color = '#ef4444'; // red-500
      pulse = true;
      break;
    case 'HIGH':
      color = '#f97316'; // orange-500
      break;
    case 'MEDIUM':
      color = '#fbbf24'; // amber-400
      break;
    case 'LOW':
    default:
      color = '#10b981'; // emerald-500
      break;
  }

  const html = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      ${
        pulse
          ? `<span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
          : ''
      }
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid #0f172a;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-risk-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export const SiteMap: React.FC<SiteMapProps> = ({
  sites,
  center = [12.9716, 77.5946], // Bangalore default
  zoom = 12,
  height = '420px',
}) => {
  // Compute default center if sites exist
  const effectiveCenter: [number, number] =
    sites.length > 0 && sites[0].latitude && sites[0].longitude
      ? [Number(sites[0].latitude), Number(sites[0].longitude)]
      : center;

  return (
    <div
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative z-10"
    >
      <MapContainer
        center={effectiveCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#090d16' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {sites.map((site) => {
          const lat = Number(site.latitude);
          const lng = Number(site.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          const icon = createRiskIcon(site.latestRiskLevel);

          return (
            <Marker key={site.id} position={[lat, lng]} icon={icon}>
              <Popup className="constructguard-popup">
                <div className="p-2 space-y-2 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">{site.name}</h4>
                    <RiskBadge
                      level={site.latestRiskLevel || 'LOW'}
                      score={site.latestRiskScore}
                    />
                  </div>

                  <p className="text-xs text-slate-600">{site.address}</p>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span>Permit Status:</span>
                      <span
                        className={`font-semibold ${
                          site.authorized ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {site.authorized ? 'Authorized' : 'NO PERMIT'}
                      </span>
                    </div>

                    {site.permit_number && (
                      <div className="flex justify-between text-slate-700">
                        <span>Permit #:</span>
                        <span className="font-mono text-[11px]">{site.permit_number}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-700">
                      <span>Open Alerts:</span>
                      <span
                        className={`font-bold ${
                          site.openAlertCount > 0 ? 'text-red-600' : 'text-slate-500'
                        }`}
                      >
                        {site.openAlertCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <Link
                      to={`/sites/${site.id}`}
                      className="block text-center text-xs font-semibold py-1 px-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
                    >
                      View Site Inspection & Telemetry &rarr;
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
