const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  overview: String,
  topRisks: [String],
  missingProtections: [String],
  recommendedActions: [String],
  finalRecommendation: {
    type: String,
    enum: ['Sign', 'Review Further', 'Do Not Sign'],
  },
}, { _id: false });

const contractSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: Number,
    mimeType: String,
    extractedText: {
      type: String,
      select: false, // Don't return by default (large field)
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
    },
    summary: summarySchema,
    missingClauses: [String],
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    errorMessage: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);
