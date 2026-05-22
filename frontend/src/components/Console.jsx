import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

const Console = ({ logs = [] }) => {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to the bottom of the terminal on new logs
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="glass-panel p-4 flex flex-col h-[280px] font-mono">
      <div className="flex items-center gap-2 border-b border-cyan-500/10 pb-2 mb-3">
        <Terminal size={14} className="text-[#00f3ff]" />
        <h2 className="text-xs font-bold tracking-[0.2em] text-[#00f3ff]">SYSTEM DIAGNOSTICS LOG</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 text-[10px] text-slate-400 pr-1 leading-relaxed">
        {logs.map((log, index) => {
          let colorClass = 'text-slate-400';
          if (log.type === 'action') colorClass = 'text-[#bd00ff]';
          if (log.type === 'response') colorClass = 'text-[#00ff66]';
          if (log.type === 'error') colorClass = 'text-red-400';
          if (log.type === 'system') colorClass = 'text-[#00f3ff]';

          return (
            <div key={index} className="flex items-start gap-1">
              <span className="text-[#0066ff] opacity-60 flex-shrink-0">&gt;&gt;</span>
              <span className="text-slate-600 flex-shrink-0">[{log.time}]</span>
              <span className={`${colorClass} break-all`}>{log.text}</span>
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default Console;
