import React from 'react';
import { FileText, Image, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const UploadCard = ({ upload, onAnalyze }) => {
  const isImage = upload.file.type.startsWith('image/');
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4 group"
    >
      <div className="relative w-12 h-12 flex-shrink-0">
        {isImage ? (
          <img 
            src={upload.preview} 
            alt="preview" 
            className="w-full h-full object-cover rounded-lg border border-slate-700" 
          />
        ) : (
          <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 text-[#00f3ff]">
            <FileText size={20} />
          </div>
        )}
        
        <div className="absolute -top-1 -right-1">
          {upload.status === 'uploaded' ? (
            <CheckCircle size={14} className="text-emerald-400 fill-slate-950" />
          ) : upload.status === 'error' ? (
            <AlertCircle size={14} className="text-rose-400 fill-slate-950" />
          ) : (
            <Loader2 size={14} className="text-cyan-400 animate-spin" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-mono font-bold text-slate-200 truncate">{upload.file.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-500 font-mono uppercase">
            {(upload.file.size / 1024).toFixed(1)} KB
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="text-[10px] text-slate-500 font-mono uppercase">
            {upload.file.type || 'Unknown Type'}
          </span>
        </div>
      </div>

      {upload.status === 'uploaded' && (
        <button 
          onClick={onAnalyze}
          className="px-3 py-1.5 rounded-lg bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] hover:bg-[#00f3ff] hover:text-slate-950 text-[10px] font-mono font-bold transition-all flex items-center gap-1.5"
        >
          <Sparkles size={12} /> ANALYZE
        </button>
      )}
    </motion.div>
  );
};

export default UploadCard;
