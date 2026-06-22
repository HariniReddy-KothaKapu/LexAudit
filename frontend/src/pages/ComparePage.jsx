import React, { useEffect, useState, useCallback } from 'react';
import { contractsAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateComparisonPDF } from '../utils/comparisonPdfGenerator';
import {
  GitCompare, Plus, Minus, RefreshCw, CheckCircle2,
  AlertTriangle, TrendingUp, TrendingDown, Minus as MinusFlat,
  FileText, ChevronDown, ChevronUp, Download, ArrowRight,
  ShieldAlert, ShieldCheck, Zap
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  added:     { label: 'Added',     color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800/60', icon: Plus,       dot: 'bg-emerald-400' },
  removed:   { label: 'Removed',   color: 'text-red-400',     bg: 'bg-red-900/30 border-red-800/60',         icon: Minus,      dot: 'bg-red-400'     },
  modified:  { label: 'Modified',  color: 'text-amber-400',   bg: 'bg-amber-900/30 border-amber-800/60',     icon: RefreshCw,  dot: 'bg-amber-400'   },
  unchanged: { label: 'Unchanged', color: 'text-slate-500',   bg: 'bg-slate-800/30 border-slate-700/40',     icon: CheckCircle2, dot: 'bg-slate-600' },
};

const ScoreDelta = ({ delta }) => {
  if (delta === 0) return <span className="text-slate-400 font-semibold flex items-center gap-1"><MinusFlat className="w-3.5 h-3.5" />No change</span>;
  if (delta > 0)  return <span className="text-red-400 font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />+{delta} riskier</span>;
  return              <span className="text-emerald-400 font-semibold flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" />{delta} safer</span>;
};

// ── Contract selector card ────────────────────────────────────────────────────
const ContractSelector = ({ label, value, contracts, onChange, excludeId }) => (
  <div className="card flex-1 min-w-0">
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
    <select
      className="input text-sm"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">— Select a contract —</option>
      {contracts
        .filter(c => c._id !== excludeId && c.status === 'completed')
        .map(c => (
          <option key={c._id} value={c._id}>
            {c.fileName} — {c.riskLevel} Risk ({c.riskScore ?? '?'}/100)
          </option>
        ))}
    </select>
  </div>
);

// ── Diff row (expandable) ────────────────────────────────────────────────────
const DiffRow = ({ item }) => {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[item.status];
  const Icon = cfg.icon;

  return (
    <div className={`border rounded-xl overflow-hidden ${cfg.bg}`}>
      <button
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
          <span className={`text-xs font-bold uppercase tracking-wider shrink-0 ${cfg.color}`}>
            <Icon className="w-3.5 h-3.5 inline mr-1" />{cfg.label}
          </span>
          <span className="text-white text-sm font-medium truncate">{item.clauseType}</span>
          {/* Risk badges */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            {item.clauseA && <RiskBadge level={item.clauseA.riskLevel} />}
            {item.status === 'modified' && item.clauseA && item.clauseB && (
              <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
            )}
            {item.clauseB && item.status !== 'removed' && <RiskBadge level={item.clauseB.riskLevel} />}
          </div>
          {/* Severity delta for modified */}
          {item.status === 'modified' && item.clauseA && item.clauseB && (
            <span className={`hidden md:inline-flex items-center text-xs px-2 py-0.5 rounded-full ml-1 ${
              item.clauseB.severity > item.clauseA.severity ? 'bg-red-900/30 text-red-400' :
              item.clauseB.severity < item.clauseA.severity ? 'bg-emerald-900/30 text-emerald-400' :
              'bg-slate-800 text-slate-500'
            }`}>
              {item.clauseA.severity} → {item.clauseB.severity}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/10 p-4">
          <div className={`grid gap-4 ${item.status === 'modified' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Contract A panel */}
            {item.clauseA && (
              <div className="space-y-2">
                {item.status === 'modified' && (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contract A (Before)</p>
                )}
                {item.status === 'removed' && (
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Minus className="w-3 h-3" /> Present in A — Removed in B
                  </p>
                )}
                <ClauseDetail clause={item.clauseA} side="A" status={item.status} />
              </div>
            )}
            {/* Contract B panel */}
            {item.clauseB && (
              <div className="space-y-2">
                {item.status === 'modified' && (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contract B (After)</p>
                )}
                {item.status === 'added' && (
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> New in Contract B
                  </p>
                )}
                <ClauseDetail clause={item.clauseB} side="B" status={item.status} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Clause detail block ───────────────────────────────────────────────────────
const ClauseDetail = ({ clause, status }) => (
  <div className="space-y-2.5 text-sm">
    <div className="flex items-center gap-2 flex-wrap">
      <RiskBadge level={clause.riskLevel} showIcon />
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        clause.riskLevel === 'High'   ? 'bg-red-900/30 text-red-400' :
        clause.riskLevel === 'Medium' ? 'bg-amber-900/30 text-amber-400' :
        'bg-emerald-900/30 text-emerald-400'}`}>
        Severity {clause.severity}/10
      </span>
    </div>
    {clause.clauseText && (
      <p className="text-slate-400 italic text-xs leading-relaxed bg-slate-800/50 rounded p-2.5 border border-slate-700/40">
        "{clause.clauseText.substring(0, 280)}{clause.clauseText.length > 280 ? '…' : ''}"
      </p>
    )}
    {clause.plainEnglish && (
      <div>
        <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">Plain English</p>
        <p className="text-slate-300 leading-relaxed">{clause.plainEnglish}</p>
      </div>
    )}
    {clause.explanation && (
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Detail</p>
        <p className="text-slate-400 leading-relaxed">{clause.explanation}</p>
      </div>
    )}
  </div>
);

// ── AI Summary panel ──────────────────────────────────────────────────────────
const AISummaryPanel = ({ aiSummary, stats }) => {
  const verdictColor =
    aiSummary.overallVerdict === 'B is Safer'   ? 'text-emerald-400' :
    aiSummary.overallVerdict === 'A is Safer'   ? 'text-red-400'     :
    aiSummary.overallVerdict === 'Significantly Different' ? 'text-amber-400' : 'text-slate-300';

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-5 h-5 text-primary-400" />
        <h2 className="text-lg font-semibold text-white">AI Comparison Summary</h2>
      </div>

      {/* Verdict + delta */}
      <div className="flex flex-col sm:flex-row gap-4 mb-5">
        <div className="flex-1 bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Overall Verdict</p>
          <p className={`text-xl font-bold ${verdictColor}`}>{aiSummary.overallVerdict}</p>
        </div>
        <div className="flex-1 bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Risk Change</p>
          <ScoreDelta delta={aiSummary.riskDelta ?? (stats.scoreB - stats.scoreA)} />
          <p className="text-slate-500 text-xs mt-1">{stats.scoreA} → {stats.scoreB} /100</p>
        </div>
        <div className="flex-1 bg-slate-800/50 rounded-lg p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Clause Changes</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-emerald-400 text-sm font-bold">+{stats.added} added</span>
            <span className="text-red-400 text-sm font-bold">-{stats.removed} removed</span>
            <span className="text-amber-400 text-sm font-bold">~{stats.modified} modified</span>
          </div>
        </div>
      </div>

      {/* Narrative summary */}
      {aiSummary.summary && (
        <p className="text-slate-300 leading-relaxed mb-5 p-4 bg-slate-800/30 rounded-lg border border-slate-700/40">
          {aiSummary.summary}
        </p>
      )}

      {/* Four detail sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Major Differences',         items: aiSummary.majorDifferences || [],        color: 'text-slate-300', bg: 'bg-slate-800/40 border-slate-700/40', dot: 'text-slate-400' },
          { label: 'New Obligations in B',       items: aiSummary.newObligationsInB || [],       color: 'text-amber-300', bg: 'bg-amber-900/10 border-amber-800/40', dot: 'text-amber-400' },
          { label: 'Removed Protections in B',   items: aiSummary.removedProtectionsInB || [],   color: 'text-red-300',   bg: 'bg-red-900/10 border-red-800/40',     dot: 'text-red-400'   },
          { label: 'Risk Decrease Factors',      items: aiSummary.riskDecreaseFactors || [],     color: 'text-emerald-300', bg: 'bg-emerald-900/10 border-emerald-800/40', dot: 'text-emerald-400' },
        ].map(({ label, items, color, bg, dot }) => (
          <div key={label} className={`rounded-lg p-3.5 border ${bg}`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
            {items.length === 0 ? (
              <p className="text-slate-600 text-sm italic">None identified</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((item, i) => (
                  <li key={i} className={`text-sm flex items-start gap-2 ${color}`}>
                    <span className={`shrink-0 mt-0.5 ${dot}`}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Recommendation */}
      {aiSummary.recommendation && (
        <div className="mt-4 bg-primary-900/20 border border-primary-800/40 rounded-lg p-4">
          <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1.5">Recommendation</p>
          <p className="text-slate-200 text-sm leading-relaxed">{aiSummary.recommendation}</p>
        </div>
      )}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ComparePage = () => {
  const [contracts, setContracts]       = useState([]);
  const [contractAId, setContractAId]   = useState('');
  const [contractBId, setContractBId]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState('');
  const [filter, setFilter]             = useState('all'); // all|added|removed|modified
  const [pdfState, setPdfState]         = useState('idle');

  // Load user's completed contracts for the pickers
  useEffect(() => {
    contractsAPI.getAll({ limit: 100 })
      .then(res => setContracts(res.data.contracts || []))
      .catch(() => setError('Failed to load your contracts.'))
      .finally(() => setLoadingContracts(false));
  }, []);

  const handleCompare = async () => {
    if (!contractAId || !contractBId) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await contractsAPI.compare(contractAId, contractBId);
      setResult(res.data.comparison);
    } catch (err) {
      const msg = err.response?.data?.message || 'Comparison failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setPdfState('generating');
    try {
      await new Promise(r => setTimeout(r, 50));
      generateComparisonPDF(result);
      setPdfState('done');
      setTimeout(() => setPdfState('idle'), 3000);
    } catch (e) {
      console.error('PDF error:', e);
      setPdfState('error');
      setTimeout(() => setPdfState('idle'), 4000);
    }
  };

  const filteredDiff = result
    ? (filter === 'all' ? result.diff : result.diff.filter(d => d.status === filter))
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitCompare className="w-6 h-6 text-primary-400" />
          Contract Comparison
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Compare two analyzed contracts to see clause changes, risk shifts, and AI-generated insights.
        </p>
      </div>

      {/* Contract pickers */}
      <div className="card mb-6">
        <p className="text-sm font-semibold text-slate-300 mb-4">Select two contracts to compare</p>
        {loadingContracts ? (
          <div className="flex items-center justify-center py-6"><LoadingSpinner text="Loading contracts..." /></div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <ContractSelector
              label="Contract A (Base)"
              value={contractAId}
              contracts={contracts}
              onChange={setContractAId}
              excludeId={contractBId}
            />
            <div className="flex items-center justify-center pb-2">
              <GitCompare className="w-5 h-5 text-slate-600" />
            </div>
            <ContractSelector
              label="Contract B (Compare to)"
              value={contractBId}
              contracts={contracts}
              onChange={setContractBId}
              excludeId={contractAId}
            />
            <button
              onClick={handleCompare}
              disabled={!contractAId || !contractBId || loading}
              className="btn-primary shrink-0 flex items-center gap-2 h-10 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Comparing…</>
              ) : (
                <><GitCompare className="w-4 h-4" />Compare</>
              )}
            </button>
          </div>
        )}

        {contracts.filter(c => c.status === 'completed').length === 0 && !loadingContracts && (
          <p className="text-slate-500 text-sm mt-3 text-center">
            No completed analyses found. <a href="/upload" className="text-primary-400 hover:underline">Upload and analyze contracts first</a>.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 mb-6 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 mt-4 text-sm">Analyzing differences with AI…</p>
          <p className="text-slate-600 text-xs mt-1">This may take 15–30 seconds</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Score comparison header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Contract A */}
            <div className="card text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Contract A</p>
              <p className="text-white font-medium text-sm truncate mb-2">{result.contractA.fileName}</p>
              <p className={`text-3xl font-bold ${result.stats.levelA === 'High' ? 'text-red-400' : result.stats.levelA === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {result.stats.scoreA}
              </p>
              <RiskBadge level={result.stats.levelA} size="lg" />
            </div>
            {/* Delta */}
            <div className="card flex flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Change</p>
              <ScoreDelta delta={result.stats.scoreB - result.stats.scoreA} />
              <div className="flex gap-3 mt-3 text-xs">
                <span className="text-emerald-400 font-semibold">+{result.stats.added}</span>
                <span className="text-red-400 font-semibold">-{result.stats.removed}</span>
                <span className="text-amber-400 font-semibold">~{result.stats.modified}</span>
              </div>
              <p className="text-slate-600 text-xs mt-1">added · removed · modified</p>
            </div>
            {/* Contract B */}
            <div className="card text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Contract B</p>
              <p className="text-white font-medium text-sm truncate mb-2">{result.contractB.fileName}</p>
              <p className={`text-3xl font-bold ${result.stats.levelB === 'High' ? 'text-red-400' : result.stats.levelB === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {result.stats.scoreB}
              </p>
              <RiskBadge level={result.stats.levelB} size="lg" />
            </div>
          </div>

          {/* AI Summary */}
          {result.aiSummary && <AISummaryPanel aiSummary={result.aiSummary} stats={result.stats} />}

          {/* Diff section */}
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">
                Clause Diff ({result.diff.length} clauses)
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter tabs */}
              {[
                { key: 'all',       label: `All (${result.diff.length})`,          color: 'text-slate-300' },
                { key: 'added',     label: `Added (${result.stats.added})`,         color: 'text-emerald-400' },
                { key: 'removed',   label: `Removed (${result.stats.removed})`,     color: 'text-red-400' },
                { key: 'modified',  label: `Modified (${result.stats.modified})`,   color: 'text-amber-400' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    filter === tab.key
                      ? `bg-slate-700 ${tab.color}`
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {/* Export PDF */}
              <button
                onClick={handleExportPDF}
                disabled={pdfState === 'generating'}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                  pdfState === 'done'       ? 'bg-emerald-600 text-white' :
                  pdfState === 'error'      ? 'bg-red-700 text-white' :
                  'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50'
                }`}
              >
                {pdfState === 'generating' ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {pdfState === 'done' ? 'Downloaded!' : pdfState === 'error' ? 'Failed' : pdfState === 'generating' ? 'Generating…' : 'Export PDF'}
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'unchanged').map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            ))}
          </div>

          {filteredDiff.length === 0 ? (
            <div className="card text-center py-10 text-slate-500">No clauses match the selected filter.</div>
          ) : (
            <div className="space-y-2">
              {filteredDiff.map((item, i) => (
                <DiffRow key={`${item.clauseType}-${i}`} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComparePage;
