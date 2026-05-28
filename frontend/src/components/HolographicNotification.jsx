import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Zap, Shield, Search, Brain, Code, Info } from 'lucide-react';
import { AGENTS } from '../config/agents';

const HolographicNotification = ({ notifications = [], onDismiss }) => {
  return (
    <div className="fixed top-24 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((note) => {
          const agent = AGENTS[note.agentId?.toUpperCase()] || AGENTS.NEXUS;
          
          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: 100, scale: 0.9, rotateY: 30 }}
              animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, x: 50, scale: 0.9, filter: 'blur(10px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="pointer-events-auto"
            >
              <div className="relative w-80 group">
                {/* Background Glass Plate */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl border-l-4 rounded-xl shadow-2xl overflow-hidden" 
                     style={{ borderLeftColor: agent.color }}>
                  
                  {/* Digital Fog / Scanline Effect */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 animate-scanline-fast" />
                  
                  <div className="p-4 flex flex-col gap-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white/5" style={{ color: agent.color }}>
                             {React.createElement(agent.icon, { size: 14 })}
                          </div>
                          <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white">
                             {agent.name} <span className="opacity-40">:: INTELLIGENCE</span>
                          </span>
                       </div>
                       <button 
                         onClick={() => onDismiss(note.id)}
                         className="text-slate-600 hover:text-white transition-colors"
                       >
                         <Zap size={12} />
                       </button>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-1 ml-1 cursor-default">
                       <h4 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                         {note.title}
                       </h4>
                       <p className="text-[10px] font-mono text-slate-400 uppercase leading-relaxed tracking-tighter">
                         {note.message}
                       </p>
                    </div>

                    {/* Footer / Telemetry */}
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                       <div className="flex gap-2">
                          <div className="w-8 h-1 rounded-full bg-white/10 overflow-hidden">
                             <motion.div 
                               animate={{ width: ['0%', '100%'] }} 
                               transition={{ duration: note.priority === 'high' ? 2 : 5, ease: 'linear' }}
                               className="h-full bg-current"
                               style={{ color: agent.color }}
                             />
                          </div>
                       </div>
                       <span className="text-[8px] font-mono text-slate-600 uppercase">Packet_SIG: 0x{note.id.substring(0, 4)}</span>
                    </div>
                  </div>
                </div>

                {/* Outer Glow */}
                <div className="absolute -inset-2 opacity-20 blur-xl rounded-xl -z-10 group-hover:opacity-40 transition-opacity"
                     style={{ backgroundColor: agent.color }} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default HolographicNotification;
