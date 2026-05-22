import React from 'react';

const JarvisCore = ({ status = 'sleeping', onClick }) => {
  // Define colors and glow effects based on state
  const stateConfig = {
    sleeping: {
      color: 'stroke-[#00f3ff]',
      glow: 'shadow-[0_0_30px_rgba(0,243,255,0.3)]',
      text: 'SYSTEM STANDBY',
      labelColor: 'text-[#00f3ff]'
    },
    listening: {
      color: 'stroke-[#bd00ff]',
      glow: 'shadow-[0_0_55px_rgba(189,0,255,0.6)]',
      text: 'LISTENING...',
      labelColor: 'text-[#bd00ff]'
    },
    processing: {
      color: 'stroke-[#ff0055]',
      glow: 'shadow-[0_0_40px_rgba(255,0,85,0.5)]',
      text: 'PROCESSING...',
      labelColor: 'text-[#ff0055]'
    },
    speaking: {
      color: 'stroke-[#00ff66]',
      glow: 'shadow-[0_0_45px_rgba(0,255,102,0.5)]',
      text: 'TRANSMITTING',
      labelColor: 'text-[#00ff66]'
    }
  };

  const current = stateConfig[status] || stateConfig.sleeping;

  return (
    <div className="flex flex-col items-center justify-center p-6 select-none">
      {/* Outer Glow container */}
      <div 
        onClick={onClick}
        className={`relative w-64 h-64 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 ${current.glow}`}
      >
        {/* Animated Ripple Waves for Listening/Speaking */}
        {(status === 'listening' || status === 'speaking') && (
          <>
            <div className={`absolute inset-0 rounded-full border-2 border-current opacity-20 animate-ping duration-1000 ${status === 'listening' ? 'text-[#bd00ff]' : 'text-[#00ff66]'}`} />
            <div className={`absolute inset-4 rounded-full border border-current opacity-40 animate-ping duration-700 ${status === 'listening' ? 'text-[#bd00ff]' : 'text-[#00ff66]'}`} />
          </>
        )}

        {/* SVG Reactor Graphics */}
        <svg className="w-full h-full absolute" viewBox="0 0 100 100">
          {/* Outer Segmented Ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="46" 
            className={`fill-none stroke-current opacity-30 ${current.color}`}
            strokeWidth="0.5" 
          />
          <circle 
            cx="50" 
            cy="50" 
            r="44" 
            className={`fill-none stroke-current stroke-dasharray-[10,8] ${current.color} ${status === 'processing' ? 'animate-spin-cw' : 'animate-spin-cw'}`} 
            style={{ animationDuration: status === 'processing' ? '3s' : '15s' }}
            strokeWidth="1.5" 
          />
          
          {/* Middle Segmented Ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="36" 
            className={`fill-none stroke-current stroke-dasharray-[5,15,10,10] ${current.color} animate-spin-ccw`} 
            style={{ animationDuration: status === 'processing' ? '2s' : '10s' }}
            strokeWidth="1" 
          />

          {/* Hexagon/Inner Ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="26" 
            className={`fill-none stroke-current stroke-dasharray-[4,4] opacity-60 ${current.color}`} 
            strokeWidth="0.8" 
          />

          {/* Central Core Circle */}
          <circle 
            cx="50" 
            cy="50" 
            r="16" 
            className={`fill-none stroke-current animate-pulse-slow ${current.color}`} 
            strokeWidth="2.5" 
          />
          
          <circle 
            cx="50" 
            cy="50" 
            r="8" 
            className={`stroke-none fill-current animate-pulse ${status === 'listening' ? 'fill-[#bd00ff]' : status === 'speaking' ? 'fill-[#00ff66]' : status === 'processing' ? 'fill-[#ff0055]' : 'fill-[#00f3ff]'}`} 
          />
        </svg>

        {/* Futuristic Core Label Inside */}
        <div className="absolute flex flex-col items-center">
          <span className="text-[10px] text-slate-500 tracking-[0.2em] font-bold">JARVIS</span>
          <span className="text-[8px] text-slate-400 mt-0.5 font-mono">V3.5_OS</span>
        </div>
      </div>

      {/* State Text Label below Reactor */}
      <div className="mt-8 flex flex-col items-center">
        <h3 className={`text-sm font-mono font-bold tracking-[0.3em] ${current.labelColor} uppercase transition-all duration-300`}>
          {current.text}
        </h3>
        <span className="text-[10px] text-slate-500 mt-1 font-mono">TAP TO INITIATE INTENT TRIGGER</span>
      </div>
    </div>
  );
};

export default JarvisCore;
