const Contract = require('../models/Contract');
const Clause = require('../models/Clause');
const { extractText } = require('../utils/textExtractor');
const { computeRiskScore, detectMissingClauses, normalizeClauseAnalysis } = require('../utils/scoreEngine');
const { analyzeContract } = require('../services/geminiService');

// POST /api/contracts/upload
exports.uploadContract = async (req, res) => {
  let contractDoc = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { originalname, mimetype, buffer, size } = req.file;

    // Create contract record immediately with "processing" status
    contractDoc = await Contract.create({
      userId: req.user._id,
      fileName: originalname,
      fileSize: size,
      mimeType: mimetype,
      status: 'processing',
    });

    res.status(202).json({
      success: true,
      message: 'Contract uploaded. Analysis in progress.',
      contractId: contractDoc._id,
    });

    // Run analysis asynchronously after responding
    runAnalysis(contractDoc, buffer, mimetype);
  } catch (error) {
    console.error('Upload error:', error);
    if (contractDoc) {
      await Contract.findByIdAndUpdate(contractDoc._id, {
        status: 'failed',
        errorMessage: error.message,
      });
    }
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
    }
  }
};

/**
 * Background analysis pipeline — single Gemini API call per contract.
 *
 * Flow:
 *   1. Extract text from the uploaded file
 *   2. Send full contract text to Gemini once → get clauses + missing + summary
 *   3. Apply rule-based normalization to every clause
 *   4. Persist clauses to MongoDB
 *   5. Compute composite risk score locally (no extra API call)
 *   6. Persist final contract results
 */
const runAnalysis = async (contractDoc, buffer, mimetype) => {
  try {
    // Step 1: Extract and clean text from PDF/DOCX
    const { cleanedText } = await extractText(buffer, mimetype);
    await Contract.findByIdAndUpdate(contractDoc._id, { extractedText: cleanedText });

    // Step 2: Single Gemini API call — returns clauses, missingClauses, summary
    console.log(`[${contractDoc._id}] Sending contract to Gemini (single call)...`);
    const aiResult = await analyzeContract(cleanedText);

    // Step 3a: Handle no-clauses case
    if (!aiResult.clauses || aiResult.clauses.length === 0) {
      const fallbackMissing = aiResult.missingClauses.length
        ? aiResult.missingClauses
        : ['Confidentiality Clause', 'Termination Clause', 'Arbitration Clause', 'Liability Clause', 'Data Privacy Clause'];

      await Contract.findByIdAndUpdate(contractDoc._id, {
        status: 'completed',
        riskScore: Math.min(fallbackMissing.length * 8, 100),
        riskLevel: fallbackMissing.length >= 3 ? 'Medium' : 'Low',
        missingClauses: fallbackMissing,
        summary: aiResult.summary || {
          overview: 'No standard clauses were detected in this document.',
          topRisks: ['No recognizable legal clauses found'],
          missingProtections: ['All standard protections appear to be missing'],
          recommendedActions: ['Have a lawyer review this document'],
          finalRecommendation: 'Review Further',
        },
      });
      return;
    }

    // Step 3b: Normalize each clause with rule-based validation layer,
    //          then persist to the Clauses collection
    const savedClauses = [];
    for (const raw of aiResult.clauses) {
      // Merge defaults for any fields Gemini may have omitted
      const safeRaw = {
        riskLevel: 'Medium',
        severity: 5,
        severityJustification: '',
        confidence: 70,
        explanation: '',
        plainEnglish: '',
        businessImpact: '',
        legalImpact: '',
        recommendation: { whyRisky: '', saferAlternative: '', negotiationPoints: [], modifiedWording: '' },
        ...raw,
      };

      // Apply rule-based normalization (clamps AI inflation)
      const normalized = normalizeClauseAnalysis(safeRaw.clauseType || 'Other', safeRaw);

      const clauseDoc = await Clause.create({
        contractId:           contractDoc._id,
        clauseType:           normalized.clauseType || 'Other',
        clauseText:           normalized.clauseText  || '',
        riskLevel:            normalized.riskLevel,
        severity:             normalized.severity,
        severityJustification: normalized.severityJustification,
        confidence:           normalized.confidence,
        explanation:          normalized.explanation,
        plainEnglish:         normalized.plainEnglish,
        businessImpact:       normalized.businessImpact,
        legalImpact:          normalized.legalImpact,
        recommendation:       normalized.recommendation,
      });
      savedClauses.push(clauseDoc);
    }

    // Step 4: Detect missing critical clauses
    // Prefer AI-detected missing list; cross-check with our rule-based detector
    const foundTypes     = savedClauses.map((c) => c.clauseType);
    const ruleBasedMissing = detectMissingClauses(foundTypes);

    // Merge: union of AI-detected and rule-based, deduplicated
    const aiMissing      = Array.isArray(aiResult.missingClauses) ? aiResult.missingClauses : [];
    const missingClauses = [...new Set([...ruleBasedMissing, ...aiMissing])];

    // Step 5: Compute composite risk score locally
    const { score, riskLevel } = computeRiskScore(savedClauses, missingClauses);

    // Step 6: Persist final contract document
    await Contract.findByIdAndUpdate(contractDoc._id, {
      status:        'completed',
      riskScore:     score,
      riskLevel,
      missingClauses,
      summary:       aiResult.summary || {
        overview:              'Analysis complete.',
        topRisks:              [],
        missingProtections:    missingClauses,
        recommendedActions:    ['Review the identified clauses with a legal professional'],
        finalRecommendation:   'Review Further',
      },
    });

    console.log(
      `[${contractDoc._id}] Analysis complete — ` +
      `${savedClauses.length} clauses, score=${score}, level=${riskLevel}, ` +
      `missing=${missingClauses.length}`
    );
  } catch (error) {
    console.error(`[${contractDoc._id}] Analysis failed:`, error.message);

    // Detect quota/rate-limit errors and give a user-friendly message
    const isQuotaError =
      error?.message?.includes('429') ||
      error?.message?.toLowerCase().includes('quota') ||
      error?.message?.toLowerCase().includes('too many requests');

    const userMessage = isQuotaError
      ? 'AI quota limit reached. The free tier allows limited requests per day. Please wait a few minutes and try again, or upgrade your Gemini API plan.'
      : error.message;

    await Contract.findByIdAndUpdate(contractDoc._id, {
      status:       'failed',
      errorMessage: userMessage,
    });
  }
};

// GET /api/contracts
exports.getContracts = async (req, res) => {
  try {
    const { search, riskLevel, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user._id };
    if (riskLevel && ['Low', 'Medium', 'High'].includes(riskLevel)) {
      query.riskLevel = riskLevel;
    }
    if (search) {
      query.fileName = { $regex: search, $options: 'i' };
    }

    const total = await Contract.countDocuments(query);
    const contracts = await Contract.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-extractedText');

    res.json({
      success: true,
      contracts,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/contracts/stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalContracts, riskDist, recent] = await Promise.all([
      Contract.countDocuments({ userId, status: 'completed' }),
      Contract.aggregate([
        { $match: { userId, status: 'completed' } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      ]),
      Contract.find({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('-extractedText'),
    ]);

    const avgScoreResult = await Contract.aggregate([
      { $match: { userId, status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$riskScore' } } },
    ]);
    const averageRiskScore = avgScoreResult[0]?.avg
      ? Math.round(avgScoreResult[0].avg)
      : 0;

    const clauseStats = await Clause.aggregate([
      {
        $lookup: {
          from: 'contracts',
          localField: 'contractId',
          foreignField: '_id',
          as: 'contract',
        },
      },
      { $unwind: '$contract' },
      {
        $match: {
          'contract.userId': userId,
          'contract.status': 'completed',
        },
      },
      { $group: { _id: '$clauseType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const riskDistMap = { Low: 0, Medium: 0, High: 0 };
    riskDist.forEach((r) => {
      if (r._id) riskDistMap[r._id] = r.count;
    });

    res.json({
      success: true,
      stats: {
        totalContracts,
        averageRiskScore,
        riskDistribution: riskDistMap,
        clauseBreakdown: clauseStats,
        recentContracts: recent,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/contracts/:id
exports.getContract = async (req, res) => {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    const clauses = await Clause.find({ contractId: contract._id }).sort({ severity: -1 });

    res.json({ success: true, contract, clauses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/contracts/:id
exports.deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    await Clause.deleteMany({ contractId: contract._id });
    await contract.deleteOne();

    res.json({ success: true, message: 'Contract deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
