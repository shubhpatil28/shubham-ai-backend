import React from 'react';
import { Search, Filter, Cpu } from 'lucide-react';

const MemorySearchBar = ({ categories, filter, setFilter }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
          <Search size={14} />
        </div>
        <input
          type="text"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
          placeholder="QUERY NEURAL DATABASE..."
          className="w-full bg-slate-950/40 border border-[#00f3ff]/20 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#00f3ff]/60 focus:bg-slate-950/60 transition-all placeholder:text-slate-600 tracking-wider"
        />
      </div>
      
      <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-800 rounded-xl p-1">
        <div className="px-3 text-slate-500">
          <Filter size={14} />
        </div>
        <div className="flex gap-1 overflow-x-auto custom-scrollbar whitespace-nowrap">
          <button
            onClick={() => setFilter({ ...filter, category: '' })}
            className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
              !filter.category ? 'bg-[#00f3ff]/10 text-[#00f3ff]' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            All Clusters
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter({ ...filter, category: cat })}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                filter.category === cat ? 'bg-[#bd00ff]/10 text-[#bd00ff]' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemorySearchBar;
