import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SensorReading } from '../types';

interface SensorLiveChartProps {
  readings: SensorReading[];
  sensorType?: string;
}

export const SensorLiveChart: React.FC<SensorLiveChartProps> = ({ readings, sensorType }) => {
  if (!readings || readings.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No sensor telemetry data recorded yet.
      </div>
    );
  }

  // Format readings for chart
  // Group or show in chronological order
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const chartData = sorted.map((r) => {
    const time = new Date(r.timestamp);
    const timeLabel = isNaN(time.getTime())
      ? r.timestamp
      : `${time.getHours().toString().padStart(2, '0')}:${time
          .getMinutes()
          .toString()
          .padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;

    return {
      time: timeLabel,
      value: Number(r.value),
      unit: r.unit,
      sensor_type: r.sensor_type,
    };
  });

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
            }}
            formatter={(val: any, _name: any, item: any) => [
              `${val} ${item.payload.unit || ''}`,
              item.payload.sensor_type,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
          <Line
            type="monotone"
            dataKey="value"
            name={sensorType ? `${sensorType.toUpperCase()} Telemetry` : 'Sensor Reading'}
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 3, fill: '#38bdf8' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
