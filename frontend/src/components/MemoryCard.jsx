import React from 'react';
import { Trash2, Calendar, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const MemoryCard = ({ memory, onDelete, onUpdate }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="glass-panel p-4 flex flex-col gap-3 group relative overflow-hidden"
    >
      {/* Glow highlight */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent opacity-30 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-[#00f3ff] uppercase tracking-widest">{memory.category}</span>
          <h4 className="text-sm font-bold text-slate-100 mt-0.5">{memory.title}</h4>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onDelete(memory.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 font-mono font-light">
        {memory.content}
      </p>

      <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
          <Calendar size={10} />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]" />
      </div>
    </motion.div>
  );
};

export default MemoryCard;
