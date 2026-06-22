const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  whyRisky: String,
  saferAlternative: String,
  negotiationPoints: [String],
  modifiedWording: String,
}, { _id: false });

const clauseSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    clauseType: {
      type: String,
      required: true,
      enum: [
        'Termination Clause',
        'Liability Clause',
        'Indemnification Clause',
        'Confidentiality Clause',
        'Payment Terms',
        'Intellectual Property Clause',
        'Governing Law Clause',
        'Non-Compete Clause',
        'Data Privacy Clause',
        'Arbitration Clause',
        'Other',
      ],
    },
    clauseText: String,
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
    },
    severityJustification: String,
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    explanation: String,
    plainEnglish: String,
    businessImpact: String,
    legalImpact: String,
    recommendation: recommendationSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Clause', clauseSchema);
