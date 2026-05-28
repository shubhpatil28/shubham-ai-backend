import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AGENTS } from '../config/agents';

const AgentNetwork = ({ activeAgentId, communicatingWith }) => {
  return (
    <div className="glass-panel p-6 overflow-hidden relative h-[400px]">
      <div className="flex items-center justify-between border-b border-[#00f3ff]/10 pb-4 mb-8">
         <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse shadow-[0_0_8px_#00f3ff]" />
           <h2 className="text-[10px] font-mono font-black tracking-[0.3em] text-[#00f3ff] uppercase">
             Neural Agent Network
           </h2>
         </div>
         <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
           Orchestration Layer V3.5
         </span>
      </div>

      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#00f3ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="50%" cy="50%" r="140" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
      </svg>

      <div className="relative w-full h-full flex items-center justify-center">
        {/* Central Nexus Node */}
        <AgentNode 
          agent={AGENTS.NEXUS} 
          isActive={activeAgentId === 'nexus'}
          isCommunicating={communicatingWith === 'nexus'} 
        />

        {/* Orbiting Agents */}
        {Object.values(AGENTS).filter(a => a.id !== 'nexus').map((agent, i) => {
          const total = Object.keys(AGENTS).length - 1;
          const angle = (i / total) * Math.PI * 2;
          const distance = 130;
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;

          return (
            <div 
              key={agent.id}
              className="absolute"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <AgentNode 
                agent={agent} 
                isActive={activeAgentId === agent.id}
                isCommunicating={communicatingWith === agent.id}
              />
              
              {/* Data Pulse Line to Nexus */}
              {(activeAgentId === agent.id || communicatingWith === agent.id) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-1/2 left-1/2 origin-left h-[1px] pointer-events-none"
                  style={{ 
                    width: distance, 
                    transform: `rotate(${angle + Math.PI}deg)`,
                    background: `linear-gradient(90deg, ${agent.color}, transparent)`
                  }}
                >
                  <motion.div 
                    animate={{ x: [0, distance] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-full bg-white shadow-[0_0_8px_white]"
                    style={{ background: agent.color }}
                  />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Agent Info Footer */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeAgentId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-6 left-6 right-6 p-3 bg-black/40 border border-white/5 rounded-xl backdrop-blur-md flex items-center gap-4"
        >
           <div 
             className="w-10 h-10 rounded-lg flex items-center justify-center"
             style={{ backgroundColor: `${AGENTS[activeAgentId?.toUpperCase()]?.color || '#00f3ff'}22`, border: `1px solid ${AGENTS[activeAgentId?.toUpperCase()]?.color || '#00f3ff'}44` }}
           >
             {React.createElement(AGENTS[activeAgentId?.toUpperCase()]?.icon || AGENTS.NEXUS.icon, { size: 20, color: AGENTS[activeAgentId?.toUpperCase()]?.color || '#00f3ff' })}
           </div>
           <div>
             <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
               {AGENTS[activeAgentId?.toUpperCase()]?.name || 'Nexus'} <span className="text-[10px] text-slate-500 font-normal ml-2">[{AGENTS[activeAgentId?.toUpperCase()]?.role || 'Orchestrator'}]</span>
             </h4>
             <p className="text-[9px] font-mono text-slate-400 mt-0.5 uppercase tracking-tighter">
               {AGENTS[activeAgentId?.toUpperCase()]?.description || 'System online.'}
             </p>
           </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const AgentNode = ({ agent, isActive, isCommunicating }) => {
  return (
    <motion.div
      animate={{
        scale: isActive ? 1.2 : 1,
        filter: isActive || isCommunicating ? `drop-shadow(0 0 15px ${agent.color})` : 'none',
      }}
      className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all bg-black border-2 ${
        isActive || isCommunicating ? 'border-none' : 'border-slate-800'
      }`}
      style={{
        backgroundColor: isActive ? `${agent.color}33` : 'black',
        borderColor: isCommunicating ? agent.color : undefined
      }}
    >
      <agent.icon size={18} color={isActive || isCommunicating ? agent.color : '#475569'} />
      
      {/* Animated Rings for active state */}
      {isActive && (
        <>
          <motion.div 
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full border border-current"
            style={{ color: agent.color }}
          />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-2 rounded-full border-2 border-transparent border-t-current"
            style={{ color: agent.color, borderStyle: 'dashed' }}
          />
        </>
      )}

      {/* Label */}
      <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold uppercase tracking-widest transition-all ${
        isActive ? 'text-white' : 'text-slate-600'
      }`}>
        {agent.name}
      </div>
    </motion.div>
  );
};

export default AgentNetwork;
