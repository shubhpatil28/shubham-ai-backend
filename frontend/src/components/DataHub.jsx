import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadCard from './UploadCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const DataHub = () => {
  const [uploads, setUploads] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const newUploads = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${file.name}`,
      status: 'pending',
      preview: URL.createObjectURL(file),
    }));
    setUploads((prev) => [...prev, ...newUploads]);
    // Upload each file to backend
    for (const up of newUploads) {
      const formData = new FormData();
      formData.append('file', up.file);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        setUploads((prev) =>
          prev.map((u) => (u.id === up.id ? { ...u, status: 'uploaded', fileId: data.file_id } : u))
        );
      } catch (e) {
        console.error(e);
        setUploads((prev) =>
          prev.map((u) => (u.id === up.id ? { ...u, status: 'error' } : u))
        );
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true });

  const handleAnalyze = async (upload) => {
    setLoading(true);
    setAnalysisResult(null);
    const endpoint = upload.file.type.startsWith('image/') ? '/api/analyze-image' : '/api/analyze-pdf';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: upload.fileId }),
      });
      const data = await res.json();
      setAnalysisResult(data.summary || data.result || 'No analysis returned');
    } catch (e) {
      console.error(e);
      setAnalysisResult('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4 bg-slate-950/20 backdrop-blur-md glass-panel">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-all ${
          isDragActive ? 'border-[#00f3ff] bg-[#00f3ff]/5' : 'border-slate-600 bg-slate-900/30'
        }`}
      >
        <input {...getInputProps()} />
        <Upload size={48} className="text-[#00f3ff]" />
        <p className="mt-4 text-sm text-slate-400">
          {isDragActive ? 'Release to upload files' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-slate-500 mt-2">PDFs, images, resumes, screenshots – all welcome</p>
      </div>

      <AnimatePresence>
        {uploads.map((up) => (
          <UploadCard key={up.id} upload={up} onAnalyze={() => handleAnalyze(up)} />
        ))}
      </AnimatePresence>

      {loading && (
        <motion.div className="flex items-center gap-2 text-[#00f3ff]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="animate-spin" size={24} />
          <span>Analyzing…</span>
        </motion.div>
      )}

      {analysisResult && (
        <div className="mt-4 p-4 bg-slate-900/60 rounded-lg border border-[#00f3ff]/20 overflow-auto max-h-96">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} className="markdown-body">
            {analysisResult}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default DataHub;
