import React from 'react';

/**
 * FallbackCard — shown when a module fails to load or is unavailable.
 * Provides a futuristic glassmorphism placeholder with pulsing animation.
 */
const FallbackCard = ({ name = 'MODULE', reason = '' }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-8 glass-panel text-center gap-4">
    {/* Animated pulse icon */}
    <div className="relative">
      <div className="w-12 h-12 rounded-full border border-slate-600/60 flex items-center justify-center text-slate-500 text-xl">
        ⊘
      </div>
      <div className="absolute inset-0 rounded-full border border-slate-700 animate-ping opacity-30" />
    </div>

    <div>
      <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-[0.25em]">
        {name} Offline
      </p>
      <p className="text-[10px] font-mono text-slate-600 mt-2 max-w-xs">
        {reason || 'This module is temporarily unavailable. The rest of SHUBHAM AI OS is fully operational.'}
      </p>
    </div>

    <button
      onClick={() => window.location.reload()}
      className="px-4 py-1.5 border border-slate-700 text-slate-500 text-[10px] font-mono uppercase rounded-lg hover:border-[#00f3ff]/30 hover:text-[#00f3ff] transition-all"
    >
      Retry
    </button>
  </div>
);

export default FallbackCard;
