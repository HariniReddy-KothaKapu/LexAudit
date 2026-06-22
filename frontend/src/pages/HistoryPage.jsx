import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contractsAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { FileText, Search, Trash2, Eye, Filter, AlertCircle } from 'lucide-react';

const HistoryPage = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const fetchContracts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await contractsAPI.getAll({ search, riskLevel: riskFilter, page, limit: 10 });
      setContracts(res.data.contracts);
      setPagination(res.data.pagination);
    } catch (err) {
      setError('Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts(1);
  }, [search, riskFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract and all its analysis data?')) return;
    setDeletingId(id);
    try {
      await contractsAPI.delete(id);
      setContracts((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert('Failed to delete contract.');
    } finally {
      setDeletingId(null);
    }
  };

  const statusBadge = (status) => {
    const map = {
      processing: 'bg-blue-900/40 text-blue-400 border-blue-800',
      completed: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
      failed: 'bg-red-900/40 text-red-400 border-red-800',
    };
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${map[status] || ''}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Contract History</h1>
        <p className="text-slate-400 mt-1">All your analyzed contracts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            className="input pl-9 pr-8 appearance-none bg-slate-800 cursor-pointer min-w-[160px]"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 mb-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner text="Loading contracts..." />
        </div>
      ) : contracts.length === 0 ? (
        <div className="card text-center py-14">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">
            {search || riskFilter ? 'No contracts match your filters.' : 'No contracts analyzed yet.'}
          </p>
          {!search && !riskFilter && (
            <Link to="/upload" className="btn-primary text-sm py-2 px-5">
              Upload First Contract
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-6 py-3">File</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Score</th>
                    <th className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">Risk</th>
                    <th className="text-right text-xs font-semibold text-slate-400 uppercase px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {contracts.map((contract) => (
                    <tr key={contract._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="text-white text-sm font-medium truncate max-w-[180px]">
                            {contract.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-sm whitespace-nowrap">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">{statusBadge(contract.status)}</td>
                      <td className="px-4 py-4 text-slate-300 text-sm font-semibold">
                        {contract.riskScore != null ? contract.riskScore : '—'}
                      </td>
                      <td className="px-4 py-4">
                        {contract.riskLevel ? <RiskBadge level={contract.riskLevel} /> : <span className="text-slate-600 text-sm">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/analysis/${contract._id}`}
                            className="p-1.5 text-slate-400 hover:text-primary-400 hover:bg-slate-800 rounded transition-colors"
                            title="View Analysis"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(contract._id)}
                            disabled={deletingId === contract._id}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === contract._id ? (
                              <div className="w-4 h-4 border-2 border-slate-600 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
              <span>{pagination.total} contracts total</span>
              <div className="flex gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchContracts(p)}
                    className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                      p === pagination.page
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;
