import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RiskTrendItem } from '../types';

interface RiskTrendChartProps {
  data: RiskTrendItem[];
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No risk trend data recorded yet.
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: item.date ? item.date.slice(5) : '', // 'MM-DD'
    avgScore: Math.round(Number(item.avgScore) * 10) / 10,
    maxScore: Math.round(Number(item.maxScore) * 10) / 10,
    highOrCritical: Number(item.highOrCritical || 0),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '0.75rem',
              color: '#f8fafc',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="maxScore"
            name="Peak Risk Score"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMax)"
          />
          <Area
            type="monotone"
            dataKey="avgScore"
            name="Average Score"
            stroke="#06b6d4"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAvg)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
