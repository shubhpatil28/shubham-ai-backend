import React from 'react';
import { Activity, Cpu, Shield, Globe, Zap, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { AGENTS } from '../config/agents';

const StatusPanel = ({ memoriesCount }) => {
  const stats = [
    { label: 'Network Integrity', val: '98.4%', icon: Globe, color: 'text-cyan-400' },
    { label: 'Neural Load', val: '12.4ms', icon: Activity, color: 'text-emerald-400' },
    { label: 'Synaptic Links', val: '14 Active', icon: Zap, color: 'text-amber-400' },
    { label: 'Memory Vaults', val: memoriesCount || 0, icon: Database, color: 'text-purple-400' },
  ];

  return (
    <div className="glass-panel p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.4em]">Environmental</span>
          <h3 className="text-sm font-mono font-black text-white tracking-widest mt-1 uppercase">Diagnostics</h3>
        </div>
        <div className="flex gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-2 group hover:border-[#00f3ff]/30 transition-all"
          >
            <div className="flex items-center gap-2">
              <s.icon size={12} className={s.color} />
              <span className="text-[8px] font-mono text-slate-500 uppercase font-black tracking-widest">{s.label}</span>
            </div>
            <div className="text-sm font-mono font-black text-white">{s.val}</div>
          </motion.div>
        ))}
      </div>

      {/* Agent Health Subpanel */}
      <div className="mt-2 flex flex-col gap-4">
         <h4 className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
           <Shield size={10} /> Agent Connectivity
         </h4>
         <div className="space-y-4">
            {Object.values(AGENTS).slice(0, 4).map((agent, i) => (
               <div key={agent.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center px-1">
                     <span className="text-[8px] font-mono text-slate-400 uppercase">{agent.name} Pulse</span>
                     <span className="text-[8px] font-mono text-emerald-400">99.2%</span>
                  </div>
                  <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                       animate={{ 
                         x: [-100, 200],
                         opacity: [0, 1, 0]
                       }}
                       transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                       className="w-20 h-full bg-current"
                       style={{ color: agent.color }}
                     />
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default StatusPanel;
