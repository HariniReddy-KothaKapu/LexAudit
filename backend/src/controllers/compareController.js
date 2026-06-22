const Contract = require('../models/Contract');
const Clause   = require('../models/Clause');
const { compareContracts } = require('../services/geminiService');

/**
 * POST /api/contracts/compare
 * Body: { contractAId, contractBId }
 *
 * Fetches both contracts + their clauses from MongoDB, computes a structural
 * (rule-based) diff, then calls Gemini once for the AI narrative summary.
 * Returns the full comparison object — no re-analysis of the contracts.
 */
exports.compareContractsHandler = async (req, res) => {
  try {
    const { contractAId, contractBId } = req.body;

    if (!contractAId || !contractBId) {
      return res.status(400).json({ success: false, message: 'Both contractAId and contractBId are required.' });
    }
    if (contractAId === contractBId) {
      return res.status(400).json({ success: false, message: 'Please select two different contracts to compare.' });
    }

    // Fetch both contracts (enforce ownership)
    const [contractA, contractB] = await Promise.all([
      Contract.findOne({ _id: contractAId, userId: req.user._id }),
      Contract.findOne({ _id: contractBId, userId: req.user._id }),
    ]);

    if (!contractA) return res.status(404).json({ success: false, message: 'Contract A not found.' });
    if (!contractB) return res.status(404).json({ success: false, message: 'Contract B not found.' });

    if (contractA.status !== 'completed') {
      return res.status(400).json({ success: false, message: `Contract A analysis is not complete (status: ${contractA.status}).` });
    }
    if (contractB.status !== 'completed') {
      return res.status(400).json({ success: false, message: `Contract B analysis is not complete (status: ${contractB.status}).` });
    }

    // Fetch clauses for both
    const [clausesA, clausesB] = await Promise.all([
      Clause.find({ contractId: contractA._id }).sort({ severity: -1 }).lean(),
      Clause.find({ contractId: contractB._id }).sort({ severity: -1 }).lean(),
    ]);

    // ── Structural diff (rule-based, no AI needed) ──────────────────────────
    const typesA = new Map(clausesA.map(c => [c.clauseType, c]));
    const typesB = new Map(clausesB.map(c => [c.clauseType, c]));

    const allTypes = new Set([...typesA.keys(), ...typesB.keys()]);

    const diff = [];
    for (const type of allTypes) {
      const inA = typesA.get(type);
      const inB = typesB.get(type);

      if (inA && !inB) {
        diff.push({ clauseType: type, status: 'removed', clauseA: inA, clauseB: null });
      } else if (!inA && inB) {
        diff.push({ clauseType: type, status: 'added', clauseA: null, clauseB: inB });
      } else if (inA && inB) {
        // Modified if risk level or severity changed, or text differs significantly
        const riskChanged     = inA.riskLevel !== inB.riskLevel;
        const severityChanged = inA.severity  !== inB.severity;
        const textChanged     = (inA.clauseText || '').substring(0, 100) !== (inB.clauseText || '').substring(0, 100);
        const status = (riskChanged || severityChanged || textChanged) ? 'modified' : 'unchanged';
        diff.push({ clauseType: type, status, clauseA: inA, clauseB: inB });
      }
    }

    // Sort: removed → added → modified → unchanged
    const ORDER = { removed: 0, added: 1, modified: 2, unchanged: 3 };
    diff.sort((a, b) => ORDER[a.status] - ORDER[b.status]);

    // ── Comparison stats ────────────────────────────────────────────────────
    const stats = {
      added:     diff.filter(d => d.status === 'added').length,
      removed:   diff.filter(d => d.status === 'removed').length,
      modified:  diff.filter(d => d.status === 'modified').length,
      unchanged: diff.filter(d => d.status === 'unchanged').length,
      totalA:    clausesA.length,
      totalB:    clausesB.length,
      scoreA:    contractA.riskScore ?? 0,
      scoreB:    contractB.riskScore ?? 0,
      levelA:    contractA.riskLevel ?? 'Low',
      levelB:    contractB.riskLevel ?? 'Low',
    };

    // ── AI narrative summary (single Gemini call) ───────────────────────────
    const aiSummary = await compareContracts(
      { fileName: contractA.fileName, riskScore: stats.scoreA, riskLevel: stats.levelA, clauses: clausesA },
      { fileName: contractB.fileName, riskScore: stats.scoreB, riskLevel: stats.levelB, clauses: clausesB }
    );

    res.json({
      success: true,
      comparison: {
        contractA: { _id: contractA._id, fileName: contractA.fileName, riskScore: stats.scoreA, riskLevel: stats.levelA, createdAt: contractA.createdAt, summary: contractA.summary },
        contractB: { _id: contractB._id, fileName: contractB.fileName, riskScore: stats.scoreB, riskLevel: stats.levelB, createdAt: contractB.createdAt, summary: contractB.summary },
        stats,
        diff,
        aiSummary,
      },
    });
  } catch (error) {
    const isQuota = error?.message?.includes('429') || error?.message?.toLowerCase().includes('quota');
    console.error('Compare error:', error.message);
    res.status(isQuota ? 429 : 500).json({
      success: false,
      message: isQuota
        ? 'AI quota limit reached. Please wait a few minutes and try again.'
        : 'Comparison failed: ' + error.message,
    });
  }
};
