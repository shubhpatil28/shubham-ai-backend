import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AGENTS } from '../config/agents';

/**
 * AgentOrb - Cinematic, holographic agent-specific core orb.
 * Reactive to specific agent identities and states.
 */
const AgentOrb = ({ agentId = 'nexus', state = 'idle', isListening = false }) => {
  const agent = AGENTS[agentId?.toUpperCase()] || AGENTS.NEXUS;
  
  // Custom states that map to visual configs
  const visualConfig = {
    color: agent.color,
    glowColor: `${agent.color}44`,
    icon: agent.icon,
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none h-full">
      <AnimatePresence mode="wait">
        <motion.div
           key={agent.id}
           initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
           animate={{ opacity: 1, scale: 1, rotateY: 0 }}
           exit={{ opacity: 0, scale: 1.2, rotateY: -90 }}
           transition={{ duration: 0.6, ease: 'easeOut' }}
           className="relative"
        >
          {/* Main Glow Aura */}
          <motion.div
            animate={{
              boxShadow: [
                `0 0 40px ${visualConfig.glowColor}`,
                `0 0 80px ${visualConfig.glowColor}`,
                `0 0 40px ${visualConfig.glowColor}`,
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-64 h-64 rounded-full flex items-center justify-center p-8"
          >
            {/* Background SVG Grid Pattern (Circular) */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
               <defs>
                 <pattern id="orbGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke={visualConfig.color} strokeWidth="0.5"/>
                 </pattern>
               </defs>
               <circle cx="50%" cy="50%" r="120" fill="url(#orbGrid)" />
            </svg>

            {/* Orbiting Particles System */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ rotate: 360 }}
                transition={{ duration: 10 + i * 5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              >
                <div 
                  className="absolute w-1.5 h-1.5 rounded-full top-0 left-1/2 -translate-x-1/2"
                  style={{ backgroundColor: visualConfig.color, boxShadow: `0 0 10px ${visualConfig.color}` }}
                />
              </motion.div>
            ))}

            {/* Rotating Mechanical Rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-4 rounded-full border border-current opacity-20"
              style={{ color: visualConfig.color, borderStyle: 'dashed', borderDasharray: '40, 20' }}
            />
            
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-10 rounded-full border-2 border-current opacity-10"
              style={{ color: visualConfig.color, borderStyle: 'dotted', borderDasharray: '4, 12' }}
            />

            {/* Inner Core Shield */}
            <div 
              className="absolute inset-20 rounded-full bg-black/40 backdrop-blur-md border border-white/5 shadow-inner"
              style={{ boxShadow: `inset 0 0 40px ${visualConfig.color}22` }}
            />

            {/* Central Agent Icon & State Core */}
            <motion.div
              animate={{
                scale: isListening ? [1, 1.1, 1] : state === 'processing' ? [1, 0.95, 1.05, 1] : 1,
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
            >
               <div className="absolute inset-0 bg-black opacity-40 z-0" />
               
               {/* Internal energy flow */}
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                 className="absolute inset-0 opacity-20 pointer-events-none"
                 style={{ background: `conic-gradient(from 0deg, transparent, ${visualConfig.color}, transparent)` }}
               />

               <agent.icon size={44} color={visualConfig.color} className="relative z-10" />
            </motion.div>

            {/* Voice Waveform (Active when listening) */}
            {isListening && (
              <div className="absolute -bottom-8 flex items-end gap-1 h-12">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, Math.random() * 30 + 10, 4] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                    className="w-1 rounded-full"
                    style={{ backgroundColor: visualConfig.color }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Agent Identity HUD */}
      <div className="mt-16 flex flex-col items-center pointer-events-none">
         <motion.div
           key={agent.id}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex flex-col items-center"
         >
            <div className="flex items-center gap-2 mb-2">
               <span className="w-12 h-[1px] bg-white/10" />
               <span className="text-[10px] font-mono font-black tracking-[0.5em] text-slate-500 uppercase">
                 AGENT IDENTITY
               </span>
               <span className="w-12 h-[1px] bg-white/10" />
            </div>
            
            <h2 
              className="text-3xl font-mono font-black tracking-widest text-white uppercase"
              style={{ textShadow: `0 0 20px ${visualConfig.color}66` }}
            >
              {agent.name}
            </h2>
            
            <div className="flex items-center gap-4 mt-3">
               <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: visualConfig.color }} />
                  <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">{agent.role}</span>
               </div>
               <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase tracking-wider">ACTIVE</span>
               </div>
            </div>
            
            <p className="mt-6 text-[10px] font-mono text-slate-500 max-w-[300px] text-center leading-relaxed tracking-wider uppercase opacity-60">
               {agent.description}
            </p>
         </motion.div>
      </div>
    </div>
  );
};

export default AgentOrb;
