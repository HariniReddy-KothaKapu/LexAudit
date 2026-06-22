import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contractsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { FileText, TrendingUp, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

const RISK_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await contractsAPI.getStats();
        setStats(res.data.stats);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const riskPieData = stats
    ? Object.entries(stats.riskDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const clauseBarData = stats?.clauseBreakdown?.slice(0, 8).map((c) => ({
    name: c._id.replace(' Clause', '').replace(' Terms', ''),
    count: c.count,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, {user?.name}</p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600/10 p-2.5 rounded-lg">
              <FileText className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Contracts</p>
              <p className="text-2xl font-bold text-white">{stats?.totalContracts ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600/10 p-2.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Avg Risk Score</p>
              <p className="text-2xl font-bold text-white">{stats?.averageRiskScore ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-red-600/10 p-2.5 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">High Risk</p>
              <p className="text-2xl font-bold text-white">{stats?.riskDistribution?.High ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600/10 p-2.5 rounded-lg">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Low Risk</p>
              <p className="text-2xl font-bold text-white">{stats?.riskDistribution?.Low ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Risk Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Risk Distribution</h2>
          {riskPieData.every((d) => d.value === 0) ? (
            <div className="flex items-center justify-center h-48 text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskPieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Clause Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Clause Breakdown</h2>
          {clauseBarData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={clauseBarData} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Contracts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Contracts</h2>
          <Link to="/history" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!stats?.recentContracts?.length ? (
          <div className="text-center py-10">
            <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">No contracts analyzed yet.</p>
            <Link to="/upload" className="btn-primary text-sm py-2 px-5">
              Upload Your First Contract
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {stats.recentContracts.map((contract) => (
              <div key={contract._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{contract.fileName}</p>
                    <p className="text-slate-500 text-xs">
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-slate-300 text-sm font-semibold">{contract.riskScore ?? '—'}</span>
                  {contract.riskLevel && <RiskBadge level={contract.riskLevel} />}
                  <Link
                    to={`/analysis/${contract._id}`}
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
