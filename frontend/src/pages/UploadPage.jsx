import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { contractsAPI } from '../services/api';
import { Upload, FileText, X, CheckCircle, AlertCircle, CloudUpload } from 'lucide-react';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [contractId, setContractId] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    if (rejectedFiles.length > 0) {
      const reason = rejectedFiles[0].errors[0]?.message || 'Invalid file.';
      setError(reason);
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_SIZE,
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('contract', file);

    try {
      const res = await contractsAPI.upload(formData);
      setContractId(res.data.contractId);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="inline-flex items-center justify-center bg-emerald-600/20 w-16 h-16 rounded-full mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Upload Successful!</h2>
          <p className="text-slate-400 mb-2">
            Your contract is being analyzed by AI. This may take 30–60 seconds.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            The analysis runs in the background. You can check back on the results page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/analysis/${contractId}`)}
              className="btn-primary"
            >
              View Analysis
            </button>
            <button
              onClick={() => { setFile(null); setSuccess(false); setContractId(null); }}
              className="btn-secondary"
            >
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Upload Contract</h1>
        <p className="text-slate-400 mt-1">Upload a PDF or DOCX file to get an instant AI risk analysis.</p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-500/5'
            : 'border-slate-700 hover:border-primary-600 bg-slate-900'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary-600/20' : 'bg-slate-800'}`}>
            <CloudUpload className={`w-10 h-10 ${isDragActive ? 'text-primary-400' : 'text-slate-500'}`} />
          </div>
          {isDragActive ? (
            <p className="text-primary-400 font-medium">Drop your file here...</p>
          ) : (
            <>
              <div>
                <p className="text-white font-medium mb-1">Drag & drop your contract here</p>
                <p className="text-slate-500 text-sm">or click to browse files</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="bg-slate-800 px-3 py-1 rounded-full">PDF</span>
                <span className="bg-slate-800 px-3 py-1 rounded-full">DOCX</span>
                <span className="bg-slate-800 px-3 py-1 rounded-full">Max 10MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected file */}
      {file && (
        <div className="mt-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-primary-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{file.name}</p>
              <p className="text-slate-500 text-xs">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            onClick={() => setFile(null)}
            className="text-slate-500 hover:text-red-400 ml-3 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Uploading & Starting Analysis...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Analyze Contract
          </>
        )}
      </button>

      {/* Info */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">What happens next?</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          {[
            'Text is extracted from your file',
            'AI identifies and classifies all legal clauses',
            'Each clause is evaluated for risk level and severity',
            'Missing critical clauses are detected',
            'A composite risk score is computed',
            'Negotiation recommendations are generated',
            'Executive summary is created',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-primary-500 font-bold shrink-0">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UploadPage;
