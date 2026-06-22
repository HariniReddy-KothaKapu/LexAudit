const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-2.0-flash: free tier, stable, works with @google/generative-ai v0.24+
const MODEL_NAME = 'gemini-2.5-flash';
console.log('=================================');
console.log('Gemini Service Initialized');
console.log('Model:', MODEL_NAME);
console.log(
  'API Key Ending:',
  process.env.GEMINI_API_KEY?.slice(-8)
);
console.log('=================================');

const getModel = () => genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Sleep for a given number of milliseconds.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract the retry delay (in ms) from a 429 error, if Gemini provides one.
 * Falls back to the provided default.
 */
const getRetryDelay = (error, defaultMs) => {
  // Gemini error message often contains "retry in Xs" or "retryDelay":"Xs"
  const match =
    String(error?.message || '').match(/retry[^\d]*(\d+(?:\.\d+)?)\s*s/i) ||
    String(error?.message || '').match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 2000; // add 2s buffer
  return defaultMs;
};

/**
 * Call Gemini with automatic retry on 429 quota errors.
 * Retries up to MAX_RETRIES times with exponential backoff.
 *
 * @param {Function} fn - async function that makes the Gemini call
 * @returns {Promise<any>}
 */
const withRetry = async (fn, maxRetries = 3) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const is429 =
        error?.message?.includes('429') ||
        error?.status === 429 ||
        error?.message?.toLowerCase().includes('quota') ||
        error?.message?.toLowerCase().includes('too many requests');

      if (!is429 || attempt === maxRetries) {
        throw error; // Not a quota error, or out of retries — propagate
      }

      // Exponential backoff: respect Gemini's suggested delay or use 2^attempt * 15s
      const backoffMs = getRetryDelay(error, Math.pow(2, attempt) * 15000);
      console.warn(
        `[Gemini] 429 quota hit (attempt ${attempt + 1}/${maxRetries + 1}). ` +
        `Retrying in ${(backoffMs / 1000).toFixed(1)}s...`
      );
      await sleep(backoffMs);
    }
  }
  throw lastError;
};

/**
 * Strip markdown code fences and parse JSON from a Gemini response.
 * Tries full parse first, then attempts to extract the first valid JSON
 * object/array via brace-matching as a fallback.
 */
const parseGeminiJSON = (text) => {
  // Remove markdown fences
  const cleaned = text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();

  // Primary: straight parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // Fallback: extract first {...} block (handles trailing commentary)
  const start = cleaned.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      else if (cleaned[i] === '}') {
        depth--;
        if (depth === 0) {
          return JSON.parse(cleaned.slice(start, i + 1));
        }
      }
    }
  }

  throw new Error('No valid JSON found in Gemini response');
};

/**
 * The full contract analysis prompt schema — embedded as a constant so it
 * is easy to read, test, and update independently.
 */
const FULL_ANALYSIS_SCHEMA = `{
  "clauses": [
    {
      "clauseType": "<one of: Termination Clause | Liability Clause | Indemnification Clause | Confidentiality Clause | Payment Terms | Intellectual Property Clause | Governing Law Clause | Non-Compete Clause | Data Privacy Clause | Arbitration Clause | Other>",
      "clauseText": "<verbatim relevant excerpt from the contract, max 500 chars>",
      "riskLevel": "<Low | Medium | High>",
      "severity": <integer 1–10, must match riskLevel range>,
      "severityJustification": "<1–2 sentences: specific reason this severity was chosen>",
      "confidence": <integer 0–100>,
      "explanation": "<2–3 sentences: what this clause does and how it affects the parties>",
      "plainEnglish": "<1–2 sentences in plain language for a non-lawyer>",
      "businessImpact": "<1–2 sentences on practical business consequences>",
      "legalImpact": "<1–2 sentences on legal consequences if triggered>",
      "recommendation": {
        "whyRisky": "<specific concern, or empty string if Low risk>",
        "saferAlternative": "<safer approach description, or empty string if Low risk>",
        "negotiationPoints": ["<point 1>", "<point 2>", "<point 3>"],
        "modifiedWording": "<suggested improved clause wording, or empty string if Low risk>"
      }
    }
  ],
  "missingClauses": ["<clause type name that is absent but important for this contract>"],
  "summary": {
    "overview": "<2–3 sentences: contract type, parties, general purpose>",
    "topRisks": ["<genuine risk — only clauses with severity >= 7 or critical missing protections>"],
    "missingProtections": ["<missing protection that matters for this contract type>"],
    "recommendedActions": ["<specific actionable step 1>", "<step 2>", "<step 3>"],
    "finalRecommendation": "<one of exactly: Sign | Review Further | Do Not Sign>"
  }
}`;

/**
 * SINGLE-CALL contract analysis.
 *
 * Sends the full contract text to Gemini once and receives:
 *   - All identified clauses with full risk analysis
 *   - Missing clause detection
 *   - Executive summary
 *
 * Replaces the previous three-step pipeline (identifyClauses →
 * analyzeClauseRisk × N → generateExecutiveSummary) with one API call.
 *
 * @param {string} contractText - cleaned, extracted contract text
 * @returns {Promise<{ clauses: Array, missingClauses: Array, summary: Object }>}
 */
const analyzeContract = async (contractText) => {
  const model = getModel();

  const prompt = `You are a senior legal risk analyst with 20 years of contract review experience.
Perform a COMPLETE analysis of the contract text below in a SINGLE response.

══════════════════════════════════════════════
CONTRACT TEXT (up to 10 000 chars):
${contractText.substring(0, 10000)}
══════════════════════════════════════════════

## YOUR TASKS:
1. Identify every legal clause present in the contract.
2. For each clause, produce a calibrated risk assessment.
3. Identify which critical clause types are MISSING.
4. Generate a balanced executive summary.

══════════════════════════════════════════════
## MANDATORY RISK SCORING GUIDELINES

### LOW RISK — severity 1–3, riskLevel "Low"
Routine clauses with minimal real-world threat:
  • Governing Law / Jurisdiction (standard jurisdiction)
  • Notice and administrative clauses
  • Standard definitions / severability / entire-agreement
  • Mutual, balanced arbitration in neutral venues

### MEDIUM RISK — severity 4–7, riskLevel "Medium"
Genuine but manageable concerns:
  • Standard NDA-style confidentiality (mutual or one-directional)
  • Termination clauses with notice period for both parties
  • Payment terms with some ambiguity
  • Data processing clauses with reasonable scope
  • IP clauses with limited, well-defined scope

### HIGH RISK — severity 8–10, riskLevel "High"
Reserve ONLY for genuine, significant legal or financial threats:
  • Broad non-compete (long duration, wide geography, many roles)
  • Unlimited / uncapped liability
  • Broad indemnification covering the other party's own negligence
  • One-sided termination with no notice
  • Assignment of ALL IP without exceptions
  • Automatic renewal with cancellation penalties
  • Excessive data ownership / usage rights
  • Heavily unbalanced financial obligations

## CRITICAL RULES:
1. Governing Law → NEVER High Risk unless it mandates litigation in a foreign country with no enforcement treaty.
2. Standard confidentiality → NEVER High Risk if scope and duration are reasonable.
3. Do NOT assign High Risk without citing a specific, concrete threat in the actual clause text.
4. severity MUST match riskLevel: Low = 1–3, Medium = 4–7, High = 8–10.
5. Default to Low or Medium for balanced, standard clauses.
6. missingClauses: list clause types that are ABSENT but would be standard/expected for this contract.
   Check for: Confidentiality Clause, Termination Clause, Arbitration Clause, Liability Clause, Data Privacy Clause.
   Only list a clause as missing if it is genuinely absent from the contract.
7. summary.topRisks: ONLY include clauses with severity >= 7, or genuinely critical missing protections.
   Do NOT list Governing Law, standard definitions, or Low Risk clauses as top risks.
   If there are fewer than 3 real risks, return only the actual ones — do not fabricate.
8. summary.finalRecommendation rules:
   • "Sign"            → no High Risk clauses, no critical missing clauses, balanced contract
   • "Review Further"  → 1–2 Medium/High risk clauses or negotiable missing protections
   • "Do Not Sign"     → multiple High Risk clauses, heavily one-sided, or critical missing protections

══════════════════════════════════════════════
## OUTPUT FORMAT
Return ONLY the following JSON object — no preamble, no explanation, no markdown outside the JSON:

${FULL_ANALYSIS_SCHEMA}`;

  const result = await withRetry(() => model.generateContent(prompt));
  const responseText = result.response.text();

  try {
    const parsed = parseGeminiJSON(responseText);

    // Validate top-level shape; return safe fallback fields if missing
    return {
      clauses:       Array.isArray(parsed.clauses) ? parsed.clauses : [],
      missingClauses: Array.isArray(parsed.missingClauses) ? parsed.missingClauses : [],
      summary:       parsed.summary || null,
    };
  } catch (e) {
    console.error('Failed to parse full contract analysis response:', e.message);
    console.error('Raw response (first 500 chars):', responseText.substring(0, 500));

    // Return a safe fallback so the pipeline doesn't crash
    return {
      clauses: [],
      missingClauses: [
        'Confidentiality Clause',
        'Termination Clause',
        'Arbitration Clause',
        'Liability Clause',
        'Data Privacy Clause',
      ],
      summary: {
        overview: 'Automated analysis encountered a parsing error. Manual review is recommended.',
        topRisks: ['Unable to parse AI response — please re-upload and try again'],
        missingProtections: ['All critical clauses should be verified manually'],
        recommendedActions: [
          'Re-upload the contract and try again',
          'Ensure the document contains readable text (not a scanned image)',
          'Consult a legal professional for a thorough review',
        ],
        finalRecommendation: 'Review Further',
      },
    };
  }
};

/**
 * Default error clause analysis — used when a clause fails to parse
 * within the full response (keeps backward compatibility if needed).
 */
const defaultClauseAnalysis = () => ({
  riskLevel: 'Medium',
  severity: 5,
  severityJustification: 'Unable to analyze this clause automatically.',
  confidence: 30,
  explanation: 'Unable to analyze this clause automatically.',
  plainEnglish: 'This clause requires manual review.',
  businessImpact: 'Unknown impact.',
  legalImpact: 'Unknown legal impact.',
  recommendation: {
    whyRisky: '',
    saferAlternative: '',
    negotiationPoints: [],
    modifiedWording: '',
  },
});

module.exports = { analyzeContract, defaultClauseAnalysis };

/**
 * CONTRACT COMPARISON — single Gemini call.
 *
 * Given two sets of analyzed clauses, asks Gemini to produce a human-readable
 * diff summary: major differences, risk changes, new obligations, removed protections.
 *
 * @param {object} contractA  - { fileName, riskScore, riskLevel, clauses[] }
 * @param {object} contractB  - { fileName, riskScore, riskLevel, clauses[] }
 * @returns {Promise<object>} - structured comparison summary
 */
const compareContracts = async (contractA, contractB) => {
  const model = getModel();

  const summariseClauses = (clauses) =>
    clauses.map(c =>
      `- [${c.clauseType}] ${c.riskLevel} risk (severity ${c.severity}/10): ${c.plainEnglish || c.explanation || c.clauseText || ''}`.substring(0, 200)
    ).join('\n');

  const prompt = `You are a senior legal analyst comparing two versions of a contract (or two related contracts).

CONTRACT A: "${contractA.fileName}"
Risk Score: ${contractA.riskScore}/100  |  Level: ${contractA.riskLevel}
Clauses:
${summariseClauses(contractA.clauses)}

CONTRACT B: "${contractB.fileName}"
Risk Score: ${contractB.riskScore}/100  |  Level: ${contractB.riskLevel}
Clauses:
${summariseClauses(contractB.clauses)}

Analyze the differences and return ONLY this JSON object (no other text):
{
  "overallVerdict": "<one of: B is Safer | A is Safer | Similar Risk | Significantly Different>",
  "riskDelta": <integer: B_score minus A_score, can be negative>,
  "riskDeltaLabel": "<e.g. '+12 points riskier' or '8 points safer' or 'unchanged'>",
  "majorDifferences": ["<key difference 1>", "<key difference 2>", "<key difference 3>"],
  "newObligationsInB": ["<obligation added in B that was not in A>"],
  "removedProtectionsInB": ["<protection present in A that is missing in B>"],
  "riskIncreaseFactors": ["<factor that makes B riskier>"],
  "riskDecreaseFactors": ["<factor that makes B safer>"],
  "recommendation": "<2-3 sentence actionable recommendation: which contract is preferable and why>",
  "summary": "<3-4 sentence plain-English narrative summarizing the most important differences>"
}`;

  const result = await withRetry(() => model.generateContent(prompt));
  const responseText = result.response.text();

  try {
    return parseGeminiJSON(responseText);
  } catch (e) {
    console.error('Failed to parse comparison response:', e.message);
    return {
      overallVerdict: 'Similar Risk',
      riskDelta: (contractB.riskScore || 0) - (contractA.riskScore || 0),
      riskDeltaLabel: 'Unable to compute',
      majorDifferences: ['Comparison could not be fully parsed — manual review recommended'],
      newObligationsInB: [],
      removedProtectionsInB: [],
      riskIncreaseFactors: [],
      riskDecreaseFactors: [],
      recommendation: 'Please review both contracts manually with a legal professional.',
      summary: 'The automated comparison encountered an error. The contracts have been loaded but AI analysis could not be completed.',
    };
  }
};

module.exports = { analyzeContract, defaultClauseAnalysis, compareContracts };
