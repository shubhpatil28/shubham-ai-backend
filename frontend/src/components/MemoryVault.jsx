import React, { useEffect, useState } from 'react';
import MemoryCard from './MemoryCard';
import MemorySearchBar from './MemorySearchBar';

const categories = ['Goals', 'Projects', 'Notes', 'Study', 'Fitness', 'Startup Ideas', 'Tasks', 'Personal Preferences'];

const MemoryVault = ({ onLog }) => {
  const [memories, setMemories] = useState([]);
  const [filter, setFilter] = useState({ category: '', q: '' });
  const [newMemory, setNewMemory] = useState({ title: '', content: '', category: '' });

  const fetchMemories = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.q) params.append('q', filter.q);
      const res = await fetch(`/api/memory?${params.toString()}`);
      if (res.ok) setMemories(await res.json());
    } catch (e) {
      console.error(e);
      onLog && onLog('Failed to fetch memories', 'error');
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [filter]);

  const handleAdd = async e => {
    e.preventDefault();
    const { title, content, category } = newMemory;
    if (!title || !content || !category) return;
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category })
      });
      if (res.ok) {
        setNewMemory({ title: '', content: '', category: '' });
        fetchMemories();
        onLog && onLog('Memory saved', 'response');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async id => {
    await fetch(`/api/memory/${id}`, { method: 'DELETE' });
    fetchMemories();
    onLog && onLog('Memory deleted', 'response');
  };

  const handleUpdate = async (id, updates) => {
    await fetch(`/api/memory/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    fetchMemories();
    onLog && onLog('Memory updated', 'response');
  };

  return (
    <div className="flex flex-col h-full p-6 bg-slate-900/70 backdrop-blur-lg">
      <h2 className="text-2xl font-bold text-cyan-300 mb-4">🧠 Memory Vault</h2>
      <MemorySearchBar
        categories={categories}
        filter={filter}
        setFilter={setFilter}
      />
      <form onSubmit={handleAdd} className="flex gap-2 mt-4 mb-6">
        <input
          className="flex-1 bg-slate-800 text-slate-100 border border-cyan-600 rounded px-2 py-1"
          placeholder="Title"
          value={newMemory.title}
          onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
        />
        <select
          className="bg-slate-800 text-slate-100 border border-cyan-600 rounded px-2 py-1"
          value={newMemory.category}
          onChange={e => setNewMemory({ ...newMemory, category: e.target.value })}
        >
          <option value="">Category</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          className="px-4 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-100 rounded"
          type="submit"
        >Add</button>
      </form>
      <div className="flex-1 overflow-y-auto grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {memories.map(mem => (
          <MemoryCard
            key={mem.id}
            memory={mem}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
};

export default MemoryVault;
