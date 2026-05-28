import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TASK_STAGES, AGENTS } from '../config/agents';
import { CheckCircle2, CircleDashed } from 'lucide-react';

const TaskPipeline = ({ currentStage, activeAgentId, taskName = "SYSTEM_OPTIMIZATION" }) => {
  const currentStageIndex = TASK_STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.4em]">Active Pipeline</span>
          <h3 className="text-sm font-mono font-black text-white tracking-widest mt-1">
            {taskName} <span className="text-cyan-400 opacity-50">#0x{Math.floor(Math.random()*9000+1000)}</span>
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-slate-500 uppercase">Assigned Agent</span>
            <span 
              className="text-[10px] font-mono font-bold uppercase tracking-wider"
              style={{ color: AGENTS[activeAgentId?.toUpperCase()]?.color || '#00f3ff' }}
            >
              {AGENTS[activeAgentId?.toUpperCase()]?.name || 'Nexus'}
            </span>
          </div>
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 border border-white/5"
            style={{ color: AGENTS[activeAgentId?.toUpperCase()]?.color || '#00f3ff' }}
          >
            {React.createElement(AGENTS[activeAgentId?.toUpperCase()]?.icon || AGENTS.NEXUS.icon, { size: 14 })}
          </div>
        </div>
      </div>

      <div className="relative flex justify-between items-center px-2">
        {/* Connection Background Line */}
        <div className="absolute left-4 right-4 h-[1px] bg-slate-800 top-1/2 -translate-y-1/2" />
        
        {/* Active Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStageIndex / (TASK_STAGES.length - 1)) * 100}%` }}
          className="absolute left-4 h-[2px] bg-cyan-500 top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          transition={{ duration: 1, ease: 'easeInOut' }}
        />

        {TASK_STAGES.map((stage, i) => {
          const isCompleted = i < currentStageIndex;
          const isActive = i === currentStageIndex;
          
          return (
            <div key={stage.id} className="relative flex flex-col items-center gap-3 z-10">
              <motion.div
                animate={{
                  scale: isActive ? 1.3 : 1,
                  backgroundColor: isCompleted || isActive ? '#06b6d4' : '#0f172a',
                  borderColor: isCompleted || isActive ? '#06b6d4' : '#334155',
                }}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all bg-[#0f172a]"
              >
                {isCompleted ? (
                   <CheckCircle2 size={14} className="text-white" />
                ) : isActive ? (
                   <stage.icon size={14} className="text-white animate-pulse" />
                ) : (
                   <stage.icon size={12} className="text-slate-600" />
                )}

                {isActive && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-cyan-500"
                  />
                )}
              </motion.div>

              <div className="flex flex-col items-center">
                 <span className={`text-[8px] font-mono font-black uppercase tracking-tighter transition-all ${
                   isActive ? 'text-cyan-400' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                 }`}>
                   {stage.label}
                 </span>
                 <AnimatePresence>
                   {isActive && (
                     <motion.span 
                       initial={{ opacity: 0, y: 5 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0 }}
                       className="absolute -bottom-4 text-[7px] font-mono text-cyan-400/60 animate-pulse whitespace-nowrap"
                     >
                       PROCESSING...
                     </motion.span>
                   )}
                 </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl flex items-center justify-between">
        <div className="flex gap-4">
           <div className="flex flex-col">
              <span className="text-[7px] font-mono text-slate-500 uppercase">Input Threads</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">12 Active</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[7px] font-mono text-slate-500 uppercase">Packet Health</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">99.8%</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: [-64, 64] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-full h-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPipeline;
