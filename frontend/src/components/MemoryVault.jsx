import React, { useEffect, useState } from 'react';
import MemoryCard from './MemoryCard';
import MemorySearchBar from './MemorySearchBar';
import GlassLoader from './GlassLoader';
import { safeFetch } from '../config/api';

const MEMORY_CACHE_KEY = 'shubham_ai_memories_cache';
const categories = ['Goals', 'Projects', 'Notes', 'Study', 'Fitness', 'Startup Ideas', 'Tasks', 'Personal Preferences'];

// ── localStorage helpers ──────────────────────────────────────
const cacheMemories = (data) => {
  try { localStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify(data)); } catch (_) {}
};
const getCachedMemories = () => {
  try { return JSON.parse(localStorage.getItem(MEMORY_CACHE_KEY)) || []; } catch (_) { return []; }
};

const MemoryVault = ({ onLog }) => {
  console.log("APP_COMPONENT_MOUNTED", "MemoryVault.jsx");
  const [memories, setMemories] = useState([]);
  const [filter, setFilter] = useState({ category: '', q: '' });
  const [newMemory, setNewMemory] = useState({ title: '', content: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [usingCache, setUsingCache] = useState(false);

  const fetchMemories = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.category) params.append('category', filter.category);
    if (filter.q) params.append('q', filter.q);

    const { data, error } = await safeFetch(`/api/memory?${params.toString()}`);

    if (error) {
      // Fallback to localStorage cache
      const cached = getCachedMemories();
      setMemories(cached);
      setUsingCache(true);
      setApiError(error);
      onLog?.('Memory API unreachable — loaded from local cache.', 'error');
    } else {
      const list = Array.isArray(data) ? data : [];
      setMemories(list);
      cacheMemories(list);   // keep cache fresh
      setUsingCache(false);
      setApiError('');
    }
    setLoading(false);
  };

  useEffect(() => { fetchMemories(); }, [filter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const { title, content, category } = newMemory;
    if (!title || !content || !category) return;

    const { data, error } = await safeFetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category }),
    });

    if (error) {
      // Optimistic local save
      const localMem = { id: `local-${Date.now()}`, title, content, category, timestamp: new Date().toISOString() };
      const updated = [localMem, ...memories];
      setMemories(updated);
      cacheMemories(updated);
      onLog?.('Memory saved locally (API offline).', 'error');
    } else {
      setNewMemory({ title: '', content: '', category: '' });
      fetchMemories();
      onLog?.('Memory saved.', 'response');
    }
  };

  const handleDelete = async (id) => {
    if (String(id).startsWith('local-')) {
      // Remove from local cache only
      const updated = memories.filter((m) => m.id !== id);
      setMemories(updated);
      cacheMemories(updated);
      return;
    }
    await safeFetch(`/api/memory/${id}`, { method: 'DELETE' });
    fetchMemories();
    onLog?.('Memory deleted.', 'response');
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-cyan-300 font-mono flex items-center gap-2">
          🧠 Memory Vault
          {usingCache && (
            <span className="text-[9px] font-mono text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
              Cached Mode
            </span>
          )}
        </h2>
        <span className="text-[10px] font-mono text-slate-500">{memories.length} FACTS LOADED</span>
      </div>

      {apiError && (
        <div className="text-[10px] font-mono text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
          {apiError}
        </div>
      )}

      <MemorySearchBar categories={categories} filter={filter} setFilter={setFilter} />

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="flex-1 bg-slate-800/60 text-slate-100 border border-cyan-600/40 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500/60"
          placeholder="Title"
          value={newMemory.title}
          onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
        />
        <input
          className="flex-1 bg-slate-800/60 text-slate-100 border border-cyan-600/40 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500/60"
          placeholder="Content"
          value={newMemory.content}
          onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
        />
        <select
          className="bg-slate-800/60 text-slate-100 border border-cyan-600/40 rounded-xl px-2 py-1.5 text-xs focus:outline-none"
          value={newMemory.category}
          onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
        >
          <option value="">Category</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          type="submit"
          className="px-4 py-1.5 bg-cyan-600/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold transition-all"
        >
          Add
        </button>
      </form>

      {loading ? (
        <GlassLoader label="LOADING MEMORY VAULT..." size="md" />
      ) : memories.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 font-mono text-xs gap-2">
          <span className="text-2xl opacity-30">🧠</span>
          <span>No memories found. Add your first fact above.</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pr-1">
          {memories.map((mem) => (
            <MemoryCard key={mem.id} memory={mem} onDelete={handleDelete} onUpdate={() => fetchMemories()} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryVault;
