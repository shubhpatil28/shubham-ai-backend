import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadCard from './UploadCard';
import { safeFetch } from '../config/api';
import GlassLoader from './GlassLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Safe markdown wrapper — validates content and catches render errors.
 */
const SafeMarkdownResult = ({ content }) => {
  if (!content || typeof content !== 'string') return null;
  try {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown-body">
        {content}
      </ReactMarkdown>
    );
  } catch (e) {
    console.warn('[DataHub] Markdown render error:', e);
    return <pre className="text-xs text-slate-300 whitespace-pre-wrap">{content}</pre>;
  }
};

const DataHub = ({ onLog }) => {
  const [uploads, setUploads] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles?.length) return;

    const newUploads = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${file.name}`,
      status: 'pending',
      preview: URL.createObjectURL(file),
    }));
    setUploads((prev) => [...prev, ...newUploads]);

    for (const up of newUploads) {
      const formData = new FormData();
      formData.append('file', up.file);

      const { data, error } = await safeFetch('/api/upload', { method: 'POST', body: formData });

      setUploads((prev) =>
        prev.map((u) =>
          u.id === up.id
            ? error
              ? { ...u, status: 'error', errorMsg: error }
              : { ...u, status: 'uploaded', fileId: data?.file_id }
            : u
        )
      );
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    onDropRejected: () => setAnalysisError('File type not supported.'),
  });

  const handleAnalyze = async (upload) => {
    if (!upload.fileId) {
      setAnalysisError('File not yet uploaded to server. Please wait a moment.');
      return;
    }
    setLoading(true);
    setAnalysisResult(null);
    setAnalysisError('');
    onLog?.('Analyzing file with AI...', 'action');

    const endpoint = upload.file.type.startsWith('image/') ? '/api/analyze-image' : '/api/analyze-pdf';
    const { data, error } = await safeFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: upload.fileId }),
    });

    if (error) {
      setAnalysisError(error);
      onLog?.(error, 'error');
    } else {
      const result = data?.summary || data?.result || 'Analysis complete — no summary returned.';
      setAnalysisResult(result);
      onLog?.('Analysis complete.', 'response');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4 bg-slate-950/20 backdrop-blur-md glass-panel">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${
          isDragActive ? 'border-[#00f3ff] bg-[#00f3ff]/5' : 'border-slate-600 bg-slate-900/30 hover:border-slate-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={48} className="text-[#00f3ff]" />
        <p className="mt-4 text-sm text-slate-400">
          {isDragActive ? 'Release to upload files' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-slate-500 mt-2">PDFs, images, resumes, screenshots – all welcome</p>
      </div>

      {/* Upload Cards */}
      <AnimatePresence>
        {uploads.map((up) => (
          <UploadCard key={up.id} upload={up} onAnalyze={() => handleAnalyze(up)} />
        ))}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <motion.div className="flex items-center gap-2 text-[#00f3ff]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="animate-spin" size={20} />
          <span className="text-xs font-mono animate-pulse">Analyzing with AI...</span>
        </motion.div>
      )}

      {/* Error */}
      {analysisError && (
        <div className="text-xs font-mono text-amber-400 border border-amber-500/20 bg-amber-500/5 rounded-xl px-3 py-2">
          {analysisError}
        </div>
      )}

      {/* Result */}
      {analysisResult && (
        <div className="mt-2 p-4 bg-slate-900/60 rounded-xl border border-[#00f3ff]/20 overflow-auto max-h-96">
          <SafeMarkdownResult content={analysisResult} />
        </div>
      )}
    </div>
  );
};

export default DataHub;
