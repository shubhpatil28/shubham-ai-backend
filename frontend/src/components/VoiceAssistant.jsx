import React from 'react';
import { Mic, MicOff } from 'lucide-react';

const VoiceAssistant = ({ isListening, onToggle }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Background ripple animation when listening */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-[-10px] rounded-full border border-red-500/30 animate-pulse-slow" />
        </>
      )}
      
      <button 
        type="button"
        onClick={onToggle}
        className={`relative z-10 p-3 rounded-full border transition-all duration-300 shadow-lg ${
          isListening 
            ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-500/30' 
            : 'bg-[#bd00ff]/10 border-[#bd00ff]/30 text-[#bd00ff] hover:bg-[#bd00ff] hover:text-white shadow-[0_0_10px_rgba(189,0,255,0.2)]'
        }`}
        title={isListening ? "Stop Listening" : "Start Voice Assistant"}
      >
        {isListening ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} />}
      </button>
    </div>
  );
};

export default VoiceAssistant;
