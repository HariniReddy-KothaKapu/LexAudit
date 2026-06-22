import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

const RISK_CONFIG = {
  Low: {
    classes: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
    icon: ShieldCheck,
  },
  Medium: {
    classes: 'bg-amber-900/50 text-amber-400 border border-amber-800',
    icon: AlertTriangle,
  },
  High: {
    classes: 'bg-red-900/50 text-red-400 border border-red-800',
    icon: ShieldAlert,
  },
};

const RiskBadge = ({ level, size = 'sm', showIcon = false }) => {
  const config = RISK_CONFIG[level] || RISK_CONFIG['Medium'];
  const Icon = config.icon;
  const sizeClasses = size === 'lg' ? 'text-sm px-3 py-1 gap-1.5' : 'text-xs px-2.5 py-0.5 gap-1';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${config.classes} ${sizeClasses}`}>
      {(showIcon || size === 'lg') && <Icon className={size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />}
      {level || 'Unknown'}
    </span>
  );
};

export default RiskBadge;
