import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

const RiskGauge = ({ score, riskLevel }) => {
  const color =
    riskLevel === 'High' ? '#ef4444' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981';

  const data = [{ value: score, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            startAngle={180}
            endAngle={-180}
            data={[{ value: 100, fill: '#1e293b' }, ...data]}
          >
            <RadialBar dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">{score}</span>
          <span className="text-sm text-slate-400">/ 100</span>
        </div>
      </div>
      <div className={`mt-2 text-lg font-bold ${
        riskLevel === 'High' ? 'text-red-400' :
        riskLevel === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
      }`}>
        {riskLevel} Risk
      </div>
    </div>
  );
};

export default RiskGauge;
