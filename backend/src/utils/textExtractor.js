const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from a PDF buffer
 */
const extractFromPDF = async (buffer) => {
  const data = await pdfParse(buffer);
  return data.text;
};

/**
 * Extract text from a DOCX buffer
 */
const extractFromDOCX = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

/**
 * Clean extracted text: normalize whitespace, remove junk characters
 */
const cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();
};

/**
 * Chunk text into sections of ~2000 characters for AI processing
 */
const chunkText = (text, chunkSize = 3000) => {
  const paragraphs = text.split('\n\n');
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + para).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = para + '\n\n';
    } else {
      current += para + '\n\n';
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
};

/**
 * Main extraction function - detects file type and extracts text
 */
const extractText = async (buffer, mimeType) => {
  let rawText = '';

  if (mimeType === 'application/pdf') {
    rawText = await extractFromPDF(buffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    rawText = await extractFromDOCX(buffer);
  } else {
    throw new Error('Unsupported file type');
  }

  const cleaned = cleanText(rawText);
  const chunks = chunkText(cleaned);

  return { cleanedText: cleaned, chunks };
};

module.exports = { extractText, cleanText, chunkText };
