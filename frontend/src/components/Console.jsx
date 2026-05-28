import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

const Console = ({ logs = [] }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogStyle = (type) => {
    switch (type) {
      case 'system': return 'text-[#bd00ff]';
      case 'action': return 'text-[#00f3ff]';
      case 'response': return 'text-emerald-400';
      case 'error': return 'text-rose-500 font-bold';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="glass-panel flex flex-col h-[300px] overflow-hidden border border-slate-800/40 shadow-2xl">
      {/* Console Header */}
      <div className="px-4 py-2 border-b border-slate-800/40 bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-[#bd00ff]" />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-400 uppercase">
            Neural Command Stream
          </span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
        </div>
      </div>

      {/* Log Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed custom-scrollbar bg-black/20"
      >
        <div className="flex flex-col gap-1.5">
          {logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3"
            >
              <span className="text-slate-700 select-none">[{log.time}]</span>
              <span className={getLogStyle(log.type)}>
                <span className="mr-2 opacity-50">SC_OS:</span>
                {log.text}
              </span>
            </motion.div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-700 animate-pulse">Initializing data stream...</div>
          )}
          
          {/* Animated cursor at the bottom */}
          <div className="flex gap-3">
             <span className="text-slate-700 opacity-0">[00:00:00]</span>
             <span className="text-[#00f3ff] animate-pulse">█</span>
          </div>
        </div>
      </div>

      {/* Footer decorations */}
      <div className="px-4 py-1.5 bg-black/40 flex justify-between items-center opacity-30 pointer-events-none">
        <span className="text-[8px] font-mono text-slate-500">PACKET_ID: 0x{Math.floor(Math.random() * 9999).toString(16).toUpperCase()}</span>
        <span className="text-[8px] font-mono text-slate-500">THROUGHPUT: 1.2 GB/S</span>
      </div>
    </div>
  );
};

export default Console;
