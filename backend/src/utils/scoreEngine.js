/**
 * LexAudit Custom Risk Scoring Engine v2
 *
 * Includes:
 * - Rule-based validation layer to normalize AI-inflated scores
 * - Calibrated scoring formula using realistic weights
 * - Confidence-weighted severity adjustments
 */

const CRITICAL_CLAUSES = [
  'Confidentiality Clause',
  'Termination Clause',
  'Arbitration Clause',
  'Liability Clause',
  'Data Privacy Clause',
];

/**
 * Per-clause-type expected severity ranges and max riskLevel.
 * Used to normalize AI responses that fall outside realistic bounds.
 *
 * Format: { min, max, maxRiskLevel }
 *   - min/max: expected severity range for a STANDARD version of this clause
 *   - maxRiskLevel: the maximum risk level unless the clause has aggravating factors
 *   - aggravatedMax: severity ceiling when genuinely problematic
 */
const CLAUSE_NORMS = {
  'Governing Law Clause':          { min: 1, max: 3,  defaultRisk: 'Low',    aggravatedMax: 3  },
  'Arbitration Clause':            { min: 2, max: 5,  defaultRisk: 'Low',    aggravatedMax: 7  },
  'Confidentiality Clause':        { min: 4, max: 6,  defaultRisk: 'Medium', aggravatedMax: 8  },
  'Termination Clause':            { min: 4, max: 6,  defaultRisk: 'Medium', aggravatedMax: 8  },
  'Payment Terms':                 { min: 4, max: 7,  defaultRisk: 'Medium', aggravatedMax: 9  },
  'Data Privacy Clause':           { min: 4, max: 7,  defaultRisk: 'Medium', aggravatedMax: 9  },
  'Liability Clause':              { min: 4, max: 7,  defaultRisk: 'Medium', aggravatedMax: 9  },
  'Indemnification Clause':        { min: 5, max: 8,  defaultRisk: 'Medium', aggravatedMax: 10 },
  'Intellectual Property Clause':  { min: 5, max: 8,  defaultRisk: 'Medium', aggravatedMax: 9  },
  'Non-Compete Clause':            { min: 6, max: 9,  defaultRisk: 'High',   aggravatedMax: 10 },
  'Other':                         { min: 3, max: 6,  defaultRisk: 'Medium', aggravatedMax: 8  },
};

/**
 * Derive riskLevel from a numeric severity score.
 */
const severityToRiskLevel = (severity) => {
  if (severity <= 3) return 'Low';
  if (severity <= 7) return 'Medium';
  return 'High';
};

/**
 * Rule-based validation: normalize AI-returned severity and riskLevel
 * for a single clause analysis result.
 *
 * Logic:
 * 1. Look up expected norms for this clause type.
 * 2. If AI score is within norms OR higher than norms AND riskLevel is "High"
 *    (i.e., the AI has a reason), allow it up to aggravatedMax.
 * 3. If AI score exceeds aggravatedMax without being "High" risk, clamp it.
 * 4. Always ensure riskLevel matches the final severity value.
 *
 * @param {string} clauseType
 * @param {object} analysis - raw AI analysis result
 * @returns {object} - normalized analysis
 */
const normalizeClauseAnalysis = (clauseType, analysis) => {
  const norm = CLAUSE_NORMS[clauseType] || CLAUSE_NORMS['Other'];

  let { severity, riskLevel, confidence = 70 } = analysis;

  // Clamp severity to valid range
  severity = Math.max(1, Math.min(10, Math.round(severity)));

  // Determine the effective ceiling:
  // If the AI flagged it as High risk (with confidence >= 60), allow up to aggravatedMax.
  // Otherwise, cap at the standard max for this clause type.
  const effectiveCeiling =
    riskLevel === 'High' && confidence >= 60
      ? norm.aggravatedMax
      : norm.max;

  // If AI score exceeds the effective ceiling, clamp it down
  if (severity > effectiveCeiling) {
    severity = effectiveCeiling;
  }

  // If AI score is below the norm minimum (AI is being too lenient), allow it —
  // we trust AI leniency more than AI inflation.
  // Exception: Non-Compete should never be below 6.
  if (clauseType === 'Non-Compete Clause' && severity < 6) {
    severity = 6;
  }

  // Recalculate riskLevel from final severity to ensure consistency
  riskLevel = severityToRiskLevel(severity);

  // Clamp confidence
  const normalizedConfidence = Math.max(0, Math.min(100, Math.round(confidence)));

  return {
    ...analysis,
    severity,
    riskLevel,
    confidence: normalizedConfidence,
  };
};

/**
 * Detect missing critical clauses from found clause types
 */
const detectMissingClauses = (foundClauseTypes) => {
  return CRITICAL_CLAUSES.filter((c) => !foundClauseTypes.includes(c));
};

/**
 * Compute unbalanced obligations penalty.
 * Only triggers when there is a genuinely high proportion of High risk clauses
 * (uses severity-weighted approach instead of raw count ratio).
 */
const computeUnbalancedPenalty = (clauses) => {
  if (!clauses.length) return 0;
  const highSeverityClauses = clauses.filter((c) => c.severity >= 8).length;
  const ratio = highSeverityClauses / clauses.length;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.3) return 1;
  return 0;
};

/**
 * Main scoring function — recalibrated formula.
 *
 * Formula (capped at 100):
 *   base     = average severity across all clauses × 4
 *   highPen  = count of High Risk clauses × 8
 *   missPen  = count of missing critical clauses × 8
 *   imbalPen = unbalanced penalty × 5
 *
 * This formula ensures:
 * - A contract with only Low risk clauses (avg severity ~2) scores ~8 → "Low"
 * - A contract with mostly Medium clauses (avg ~5) scores ~20–35 → "Low/Medium"
 * - A contract with multiple High risk clauses (avg ~8+) scores 60+ → "High"
 *
 * @param {Array} clauses - normalized clause objects
 * @param {Array} missingClauses - array of missing clause name strings
 * @returns {{ score: number, riskLevel: string }}
 */
const computeRiskScore = (clauses, missingClauses = []) => {
  if (!clauses.length && !missingClauses.length) {
    return { score: 100, riskLevel: 'Low' };
  }

  // 1. Base score starts at SAFE 100
  let score = 100;

  // 2. Average severity penalty (balanced)
  const avgSeverity =
    clauses.length > 0
      ? clauses.reduce((sum, c) => sum + (c.severity || 1), 0) / clauses.length
      : 0;

  score -= avgSeverity * 3; // reduced impact (was 4+ additive earlier)

  // 3. High risk clause penalty (controlled)
  const highRiskCount = clauses.filter((c) => c.riskLevel === 'High').length;
  score -= highRiskCount * 6;

  // 4. Missing clauses penalty (weighted properly)
  score -= missingClauses.length * 5;

  // 5. Unbalanced penalty (keep but soften)
  const unbalancedPenalty = computeUnbalancedPenalty(clauses);
  score -= unbalancedPenalty * 3;

  // 6. Clamp score
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  // 7. Risk mapping (IMPORTANT FIX)
  let riskLevel;
  if (score >= 80) riskLevel = 'Low';
  else if (score >= 60) riskLevel = 'Medium';
  else riskLevel = 'High';

  return { score: Math.round(score), riskLevel };
};
module.exports = {
  computeRiskScore,
  detectMissingClauses,
  normalizeClauseAnalysis,
  CRITICAL_CLAUSES,
  CLAUSE_NORMS,
};
