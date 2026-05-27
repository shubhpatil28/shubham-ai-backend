import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="flex w-full justify-start mb-4">
      <div className="flex max-w-[85%] flex-row items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border bg-[#00f3ff]/10 border-[#00f3ff]/40 text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.2)]">
          <Bot size={16} />
        </div>

        {/* Indicator */}
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-mono text-slate-500 uppercase mb-1 tracking-wider">
            Shubham AI is thinking
          </span>
          <div className="px-4 py-4 rounded-2xl bg-[#00f3ff]/5 border border-[#00f3ff]/20 rounded-tl-none shadow-[0_4px_15px_rgba(0,243,255,0.05)] flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-typing-dot" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-typing-dot" style={{ animationDelay: '200ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#00f3ff] animate-typing-dot" style={{ animationDelay: '400ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
