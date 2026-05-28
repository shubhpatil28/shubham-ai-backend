import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, TrendingUp, Search, Zap, Eye, ChevronRight, Activity } from 'lucide-react';

const IntelligenceFeed = () => {
  const [items, setItems] = useState([
    { id: 1, title: 'SYNTHETIC_BRAIN_V4_RELEASED', type: 'TECH', source: 'REUTERS_AI', time: 'LIVE' },
    { id: 2, title: 'NEURAL_LINK_STABILITY_UPGRADE', type: 'DATA', source: 'ORACLE_CORE', time: '2M' },
    { id: 3, title: 'CRYPTO_MARKET_VOLATILITY_ALERT', type: 'MARKET', source: 'BLMBRG', time: '5M' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newsPool = [
        { title: 'NEW_AI_MODELS_DETECTED_IN_HUGGINGFACE', type: 'TREND', source: 'GIT_INTEL' },
        { title: 'QUANTUM_COMPUTING_BREAKTHROUGH_IN_ZURICH', type: 'TECH', source: 'SCI_HUB' },
        { title: 'GLOBAL_NETWORK_TRAFFIC_SPIKE_DETECTED', type: 'SURVEILLANCE', source: 'SENTINEL_NODE' },
        { title: 'AUTONOMOUS_ENTITY_SHUBHAM_UPGRADE_COMPLETE', type: 'SYSTEM', source: 'NEXUS_OS' },
      ];
      const selected = newsPool[Math.floor(Math.random() * newsPool.length)];
      const newItem = { ...selected, id: Date.now(), time: 'NOW' };
      
      setItems(prev => [newItem, ...prev.slice(0, 5)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel p-6 flex flex-col h-[400px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.4em]">Autonomous Oracle</span>
          <h3 className="text-sm font-mono font-black text-white tracking-widest mt-1 uppercase flex items-center gap-2">
            <Globe size={14} className="text-emerald-400 animate-pulse" />
            Internet Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
           <Activity size={10} className="text-emerald-400" />
           <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Global Live Scan</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative"
              >
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-1 hover:border-emerald-500/30 transition-all cursor-default">
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] font-mono text-emerald-500 font-black tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {item.type}
                    </span>
                    <span className="text-[8px] font-mono text-slate-600 font-bold">::{item.time}</span>
                  </div>
                  
                  <h4 className="text-[10px] font-mono font-bold text-white uppercase tracking-tighter mt-1 group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h4>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-emerald-500" />
                       <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">SRC: {item.source}</span>
                    </div>
                    <ChevronRight size={10} className="text-slate-700" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Cinematic Overlay at bottom to show more data can surface */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      <div className="mt-4 flex items-center justify-between text-[8px] font-mono text-slate-600">
         <div className="flex items-center gap-2">
            <Zap size={10} className="text-amber-500" />
            <span>AI ANALYSIS ACTIVE</span>
         </div>
         <div className="animate-pulse">STREAMING DATA_PACKETS...</div>
      </div>
    </div>
  );
};

export default IntelligenceFeed;
