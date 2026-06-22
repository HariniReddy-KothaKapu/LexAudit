import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contractsAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import RiskGauge from '../components/RiskGauge';
import LoadingSpinner from '../components/LoadingSpinner';
import { generatePDFReport } from '../utils/pdfGenerator';
import {
  AlertTriangle, ShieldAlert, ChevronDown, ChevronUp,
  FileText, TrendingUp, Scale, ArrowLeft, Clock, Download, CheckCircle2
} from 'lucide-react';

const ClauseCard = ({ clause }) => {
  const [expanded, setExpanded] = useState(false);

  const confidenceColor =
    clause.confidence >= 80 ? 'text-emerald-400' :
    clause.confidence >= 50 ? 'text-amber-400' : 'text-slate-500';

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden transition-colors ${
      clause.riskLevel === 'High' ? 'border-red-900/50' :
      clause.riskLevel === 'Medium' ? 'border-amber-900/50' : 'border-emerald-900/30'
    }`}>
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <RiskBadge level={clause.riskLevel} showIcon />
          <span className="text-white font-medium text-sm truncate">{clause.clauseType}</span>
          {/* Severity pill */}
          <span className={`hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
            ${clause.riskLevel === 'High' ? 'bg-red-900/30 text-red-400' :
              clause.riskLevel === 'Medium' ? 'bg-amber-900/30 text-amber-400' :
              'bg-emerald-900/30 text-emerald-400'}`}>
            Severity {clause.severity}/10
          </span>
          {/* Confidence pill */}
          {clause.confidence != null && (
            <span className={`hidden md:inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-slate-800 ${confidenceColor}`}>
              {clause.confidence}% confidence
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          {/* Mobile: severity + confidence row */}
          <div className="flex flex-wrap items-center gap-2 sm:hidden">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
              ${clause.riskLevel === 'High' ? 'bg-red-900/30 text-red-400' :
                clause.riskLevel === 'Medium' ? 'bg-amber-900/30 text-amber-400' :
                'bg-emerald-900/30 text-emerald-400'}`}>
              Severity {clause.severity}/10
            </span>
            {clause.confidence != null && (
              <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-slate-800 ${confidenceColor}`}>
                {clause.confidence}% confidence
              </span>
            )}
          </div>

          {/* Clause text */}
          {clause.clauseText && (
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Clause Text</p>
              <p className="text-slate-300 text-sm leading-relaxed italic">"{clause.clauseText}"</p>
            </div>
          )}

          {/* Plain English */}
          {clause.plainEnglish && (
            <div>
              <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1.5">
                Plain English
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">{clause.plainEnglish}</p>
            </div>
          )}

          {/* Explanation */}
          {clause.explanation && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Explanation
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">{clause.explanation}</p>
            </div>
          )}

          {/* Severity justification */}
          {clause.severityJustification && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Why This Score
              </p>
              <p className="text-slate-400 text-sm italic">{clause.severityJustification}</p>
            </div>
          )}

          {/* Impact grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {clause.businessImpact && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                  Business Impact
                </p>
                <p className="text-slate-300 text-sm">{clause.businessImpact}</p>
              </div>
            )}
            {clause.legalImpact && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">
                  Legal Impact
                </p>
                <p className="text-slate-300 text-sm">{clause.legalImpact}</p>
              </div>
            )}
          </div>

          {/* Recommendation (only for Medium/High) */}
          {clause.riskLevel !== 'Low' && clause.recommendation && (
            <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Negotiation Recommendations
              </p>
              {clause.recommendation.whyRisky && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Why it's risky:</p>
                  <p className="text-slate-300 text-sm">{clause.recommendation.whyRisky}</p>
                </div>
              )}
              {clause.recommendation.negotiationPoints?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Negotiation points:</p>
                  <ul className="space-y-1">
                    {clause.recommendation.negotiationPoints.map((pt, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-emerald-500 shrink-0">•</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {clause.recommendation.modifiedWording && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Suggested wording:</p>
                  <p className="text-slate-300 text-sm bg-slate-800 rounded p-2 italic">
                    "{clause.recommendation.modifiedWording}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AnalysisPage = () => {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [clauses, setClauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const [pdfState, setPdfState] = useState('idle'); // 'idle' | 'generating' | 'done' | 'error'

  const fetchData = async () => {
    try {
      const res = await contractsAPI.getById(id);
      setContract(res.data.contract);
      setClauses(res.data.clauses || []);
      return res.data.contract.status;
    } catch (err) {
      setError('Contract not found or access denied.');
      return 'failed';
    }
  };

  useEffect(() => {
    let interval;

    const init = async () => {
      setLoading(true);
      const status = await fetchData();
      setLoading(false);

      if (status === 'processing') {
        setPolling(true);
        interval = setInterval(async () => {
          const s = await fetchData();
          if (s !== 'processing') {
            clearInterval(interval);
            setPolling(false);
          }
        }, 5000);
      }
    };

    init();
    return () => { if (interval) clearInterval(interval); };
  }, [id]);

  const handleDownloadPDF = async () => {
    setPdfState('generating');
    try {
      await new Promise(r => setTimeout(r, 50)); // allow spinner to render
      generatePDFReport(contract, clauses);
      setPdfState('done');
      setTimeout(() => setPdfState('idle'), 3000);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setPdfState('error');
      setTimeout(() => setPdfState('idle'), 4000);
    }
  };

  if (loading) {    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading analysis..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 text-lg">{error}</p>
        <Link to="/history" className="btn-secondary mt-6 inline-block">Back to History</Link>
      </div>
    );
  }

  if (contract?.status === 'processing') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="inline-flex items-center justify-center bg-primary-600/20 w-16 h-16 rounded-full mb-4">
            <Clock className="w-8 h-8 text-primary-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Analysis in Progress</h2>
          <p className="text-slate-400 mb-4">
            AI is analyzing your contract. This typically takes 30–60 seconds.
          </p>
          {polling && (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
              <div className="w-3 h-3 border-2 border-slate-600 border-t-primary-500 rounded-full animate-spin" />
              Checking for updates...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (contract?.status === 'failed') {
    const isQuota = contract.errorMessage?.toLowerCase().includes('quota') ||
                    contract.errorMessage?.toLowerCase().includes('429') ||
                    contract.errorMessage?.toLowerCase().includes('too many requests');

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isQuota ? 'text-amber-400' : 'text-red-400'}`} />
          <h2 className="text-xl font-bold text-white mb-2">
            {isQuota ? 'API Quota Limit Reached' : 'Analysis Failed'}
          </h2>
          <p className="text-slate-400 mb-4 text-sm leading-relaxed">
            {isQuota
              ? 'The free Gemini API tier has a daily request limit. Please wait a few minutes and try again, or upload a new copy of the contract.'
              : contract.errorMessage || 'An error occurred during analysis.'}
          </p>
          {isQuota && (
            <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-3 mb-5 text-xs text-amber-300 text-left">
              <p className="font-semibold mb-1">Why does this happen?</p>
              <p>The free Gemini API tier allows a limited number of requests per day. Once the limit is hit, new analyses are blocked until the quota resets (usually within 24 hours).</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/upload" className="btn-primary inline-flex items-center justify-center gap-2">
              Upload &amp; Retry
            </Link>
            <Link to="/history" className="btn-secondary inline-flex items-center justify-center gap-2">
              Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const highRisk = clauses.filter((c) => c.riskLevel === 'High');
  const mediumRisk = clauses.filter((c) => c.riskLevel === 'Medium');
  const lowRisk = clauses.filter((c) => c.riskLevel === 'Low');

  const finalRecColor =
    contract?.summary?.finalRecommendation === 'Sign' ? 'text-emerald-400' :
    contract?.summary?.finalRecommendation === 'Do Not Sign' ? 'text-red-400' : 'text-amber-400';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link to="/history" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to History
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            {contract.fileName}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Analyzed on {new Date(contract.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>

          {/* Download PDF button */}
          <div className="mt-4">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfState === 'generating'}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                pdfState === 'done'
                  ? 'bg-emerald-600 text-white'
                  : pdfState === 'error'
                  ? 'bg-red-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-60 disabled:cursor-not-allowed'
              }`}
            >
              {pdfState === 'generating' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating PDF…
                </>
              ) : pdfState === 'done' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Downloaded!
                </>
              ) : pdfState === 'error' ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Failed — Try Again
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </>
              )}
            </button>
          </div>
        </div>
        <div className="shrink-0">
          <RiskGauge score={contract.riskScore ?? 0} riskLevel={contract.riskLevel ?? 'Low'} />
        </div>
      </div>

      {/* Executive Summary */}
      {contract.summary && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">Executive Summary</h2>
          </div>

          {contract.summary.overview && (
            <p className="text-slate-300 mb-4 leading-relaxed">{contract.summary.overview}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {contract.summary.topRisks?.length > 0 && (
              <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-400 uppercase mb-2">Top Risks</p>
                <ul className="space-y-1">
                  {contract.summary.topRisks.map((r, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <span className="text-red-500 shrink-0">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {contract.summary.missingProtections?.length > 0 && (
              <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-400 uppercase mb-2">Missing Protections</p>
                <ul className="space-y-1">
                  {contract.summary.missingProtections.map((r, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <span className="text-amber-500 shrink-0">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {contract.summary.recommendedActions?.length > 0 && (
              <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-emerald-400 uppercase mb-2">Recommended Actions</p>
                <ul className="space-y-1">
                  {contract.summary.recommendedActions.map((r, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <span className="text-emerald-500 shrink-0">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {contract.summary.finalRecommendation && (
            <div className="border-t border-slate-800 pt-4">
              <p className="text-slate-400 text-sm">
                Final Recommendation:{' '}
                <span className={`font-bold text-base ${finalRecColor}`}>
                  {contract.summary.finalRecommendation}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Missing Clauses Alert */}
      {contract.missingClauses?.length > 0 && (
        <div className="bg-amber-900/10 border border-amber-800/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-amber-300">Missing Critical Clauses</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {contract.missingClauses.map((c) => (
              <span key={c} className="bg-amber-900/30 border border-amber-800/50 text-amber-300 text-xs px-3 py-1 rounded-full">
                {c}
              </span>
            ))}
          </div>
          <p className="text-amber-600 text-xs mt-2">
            These clauses are missing from the contract and could expose you to risk.
          </p>
        </div>
      )}

      {/* Clause Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-bold text-red-400">{highRisk.length}</p>
          <p className="text-slate-400 text-sm mt-1">High Risk</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-400">{mediumRisk.length}</p>
          <p className="text-slate-400 text-sm mt-1">Medium Risk</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-emerald-400">{lowRisk.length}</p>
          <p className="text-slate-400 text-sm mt-1">Low Risk</p>
        </div>
      </div>

      {/* Clause List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-white">
            Clause Analysis ({clauses.length} clauses found)
          </h2>
        </div>

        {clauses.length === 0 ? (
          <div className="card text-center py-10 text-slate-400">
            No clauses were detected in this contract.
          </div>
        ) : (
          <div className="space-y-3">
            {/* High first */}
            {[...highRisk, ...mediumRisk, ...lowRisk].map((clause) => (
              <ClauseCard key={clause._id} clause={clause} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
