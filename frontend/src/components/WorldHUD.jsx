import React from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Radio, Activity } from 'lucide-react';

const WorldHUD = () => {
  // Simulated node positions on a relative coordinate grid
  const globalNodes = [
    { id: 1, x: '25%', y: '35%', label: 'SAN_FRANCISCO', status: 'active' },
    { id: 2, x: '48%', y: '30%', label: 'NEW_YORK', status: 'idle' },
    { id: 3, x: '75%', y: '40%', label: 'LONDON', status: 'active' },
    { id: 4, x: '88%', y: '55%', label: 'TOKYO', status: 'sync' },
    { id: 5, x: '55%', y: '75%', label: 'SAO_PAULO', status: 'idle' },
    { id: 6, x: '78%', y: '70%', label: 'DUBAI', status: 'active' },
  ];

  return (
    <div className="glass-panel p-6 relative overflow-hidden h-[300px]">
      {/* Header HUD */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6 relative z-10">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.4em]">Satellite Surveillance</span>
          <h3 className="text-sm font-mono font-black text-white tracking-widest mt-0.5 uppercase flex items-center gap-2">
            <Radio size={14} className="text-[#00f3ff] animate-pulse" />
            Global Neural Traffic
          </h3>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono font-bold text-emerald-400">SYNC_SUCCESS</span>
          <span className="text-[7px] font-mono text-slate-500 uppercase">Uptime: 99.98%</span>
        </div>
      </div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#00f3ff 1px, transparent 0)', backgroundSize: '20px 20px' }} />
      </div>

      {/* World Map Container (Relative area) */}
      <div className="relative w-full h-48 mt-4 bg-white/2 rounded-2xl border border-white/5 overflow-hidden">
         {/* Simplified Map Paths / Dots */}
         <div className="absolute inset-0 opacity-10 flex items-center justify-center">
            <Globe size={150} className="text-white" />
         </div>

         {/* Animated Connections and Nodes */}
         {globalNodes.map((node) => (
           <div 
             key={node.id} 
             className="absolute"
             style={{ left: node.x, top: node.y }}
           >
             <div className="relative flex flex-col items-center">
                <motion.div 
                  animate={{ 
                    scale: node.status === 'active' ? [1, 1.5, 1] : 1,
                    opacity: node.status === 'active' ? [0.4, 1, 0.4] : 0.4
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full border border-[#00f3ff]"
                />
                <div 
                  className={`w-1 h-1 rounded-full absolute top-1 ${node.status === 'active' ? 'bg-[#00f3ff]' : 'bg-slate-700'}`}
                  style={{ boxShadow: node.status === 'active' ? '0 0 8px #00f3ff' : 'none' }}
                />
                
                {/* Node Label Popover (HUD Style) */}
                <div className="absolute -top-7 text-[7px] font-mono text-white bg-black/80 border border-white/10 px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                   {node.label} // {node.status.toUpperCase()}
                </div>
             </div>
           </div>
         ))}

         {/* Neural Data Lines simulation (Curved SVGs) */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <motion.path 
               d="M 50 50 Q 150 10 250 80" 
               fill="none" 
               stroke="#00f3ff" 
               strokeWidth="0.5" 
               strokeDasharray="4 2"
               initial={{ pathLength: 0 }}
               animate={{ pathLength: 1 }}
               transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.path 
               d="M 100 120 Q 200 180 300 100" 
               fill="none" 
               stroke="#bd00ff" 
               strokeWidth="0.5" 
               strokeDasharray="4 2"
               initial={{ pathLength: 0 }}
               animate={{ pathLength: 1 }}
               transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />
         </svg>
      </div>

      {/* Bottom Telemetry Footer */}
      <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center opacity-40">
         <div className="flex gap-4">
            <div className="flex items-center gap-1.5 font-mono text-[7px] text-slate-500">
               <Activity size={10} /> PKT_LOSS: 0.002%
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[7px] text-slate-500">
               <MapPin size={10} /> ACTIVE_NODES: 142
            </div>
         </div>
         <span className="text-[7px] font-mono text-[#00f3ff] animate-pulse uppercase">Syncing with Sentinel Grid...</span>
      </div>
    </div>
  );
};

export default WorldHUD;
