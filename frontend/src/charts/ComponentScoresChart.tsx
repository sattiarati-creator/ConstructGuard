import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ComponentScoresChartProps {
  visualScore: number;
  changeScore: number;
  sensorScore: number;
  timeScore: number;
  permitScore: number;
}

export const ComponentScoresChart: React.FC<ComponentScoresChartProps> = ({
  visualScore,
  changeScore,
  sensorScore,
  timeScore,
  permitScore,
}) => {
  const data = [
    {
      name: 'Visual (30%)',
      raw: visualScore,
      weighted: (visualScore * 0.3).toFixed(1),
      color: '#38bdf8', // sky-400
    },
    {
      name: 'Change (25%)',
      raw: changeScore,
      weighted: (changeScore * 0.25).toFixed(1),
      color: '#818cf8', // indigo-400
    },
    {
      name: 'Sensor (20%)',
      raw: sensorScore,
      weighted: (sensorScore * 0.2).toFixed(1),
      color: '#fbbf24', // amber-400
    },
    {
      name: 'Time (15%)',
      raw: timeScore,
      weighted: (timeScore * 0.15).toFixed(1),
      color: '#f97316', // orange-500
    },
    {
      name: 'Permit (10%)',
      raw: permitScore,
      weighted: (permitScore * 0.1).toFixed(1),
      color: '#ef4444', // red-500
    },
  ];

  return (
    <div className="w-full space-y-4">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px',
              }}
              formatter={(value: any, _name: any, item: any) => [
                `${value} / 100 (Contributes +${item.payload.weighted} pts)`,
                'Score',
              ]}
            />
            <Bar dataKey="raw" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
        {data.map((d) => (
          <div key={d.name} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <span className="text-slate-400 block text-[10px]">{d.name}</span>
            <span className="font-bold text-white text-sm">{d.raw}</span>
            <span className="text-[10px] text-slate-500 block">+{d.weighted} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};
