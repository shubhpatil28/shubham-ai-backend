import React, { useState, useEffect } from 'react';
import { Brain, Search, Trash2, ArrowUpRight, Plus, Download, Upload, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';

const MemoryVault = ({ onLog }) => {
  const [memories, setMemories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add memory form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCat, setNewCat] = useState('note');
  const [newTags, setNewTags] = useState('');
  const [newImportance, setNewImportance] = useState(5);

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await fetch('/api/memory/insights');
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMemories();
    fetchInsights();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchMemories();
      return;
    }
    setLoading(true);
    try {
      const catParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const res = await fetch(`/api/memory/search?query=${encodeURIComponent(searchQuery)}${catParam}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCat,
          tags: newTags,
          importance: newImportance
        })
      });
      if (res.ok) {
        setNewTitle('');
        setNewContent('');
        setNewTags('');
        setNewImportance(5);
        fetchMemories();
        fetchInsights();
        if (onLog) onLog(`Remembered: [${newCat.toUpperCase()}] ${newTitle}`, "system");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMemory = async (id) => {
    try {
      const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMemories();
        fetchInsights();
        if (onLog) onLog("Memory forgotten from SQLite database.", "system");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = () => {
    window.open('/api/memory/export', '_blank');
    if (onLog) onLog("Exported JSON memory register package.", "system");
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    try {
      const res = await fetch('/api/memory/import', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        fetchMemories();
        fetchInsights();
        if (onLog) onLog(data.message, "response");
      } else {
        if (onLog) onLog("Failed to import backup.", "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      // Reset file input
      e.target.value = null;
    }
  };

  const categories = [
    { value: 'all', label: 'All Braincells' },
    { value: 'goal', label: 'Goals' },
    { value: 'project', label: 'Projects' },
    { value: 'ui_style', label: 'UI Themes' },
    { value: 'routine', label: 'Routines' },
    { value: 'contact', label: 'Contacts' },
    { value: 'business_idea', label: 'Business Ideas' },
    { value: 'preference', label: 'Preferences' },
    { value: 'fact', label: 'Facts' },
    { value: 'skill', label: 'Skills' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 p-6 h-full overflow-y-auto">
      {/* Sidebar: Add Memory & Import/Export */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        {/* Statistics insights */}
        <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl">
          <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
            <BarChart2 className="text-[#00f3ff] w-4 h-4" /> Cognitive Analysis
          </h3>
          {insights ? (
            <div className="space-y-3 font-mono text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Total Memories:</span>
                <span className="text-[#00f3ff] font-bold">{insights.total_memories}</span>
              </div>
              <div className="flex justify-between">
                <span>Memory Strengths:</span>
                <span className="text-[#bd00ff] font-bold">{insights.total_associations} links</span>
              </div>
              <div className="pt-3 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Category distribution</span>
                <div className="space-y-1.5">
                  {Object.entries(insights.category_distribution || {}).map(([cat, count]) => (
                    <div key={cat} className="flex justify-between text-[11px]">
                      <span className="capitalize">{cat.replace('_', ' ')}:</span>
                      <span className="text-white font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-600 font-mono text-[10px] py-6 animate-pulse">
              ANALYZING SYNAPSE CONNECTIONS...
            </div>
          )}
        </div>

        {/* Create Memory Form */}
        <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl">
          <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
            <Plus className="text-[#bd00ff] w-4 h-4" /> Inject Memory
          </h3>
          <form onSubmit={handleAddMemory} className="space-y-4">
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Title / Key Identifier</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Minimalist Dark Mode, Startup Goal"
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Memory Content / Detail</label>
              <textarea
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="e.g. Favorite UI is black mesh gradient background with glowing cyan borders..."
                rows="3"
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-2 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="goal">Goal</option>
                  <option value="project">Project</option>
                  <option value="ui_style">UI Preference</option>
                  <option value="routine">Routine</option>
                  <option value="contact">Contact</option>
                  <option value="business_idea">Business Idea</option>
                  <option value="preference">Preference</option>
                  <option value="fact">Fact</option>
                  <option value="skill">Skill</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Importance (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newImportance}
                  onChange={(e) => setNewImportance(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Tags (Space separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="design react css tailwind"
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-1.5"
            >
              Remember Fact
            </button>
          </form>
        </div>

        {/* JSON Backup Panel */}
        <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl">
          <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
            <Download className="text-emerald-400 w-4 h-4" /> JSON Portability
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1"
            >
              <Download size={14} className="text-[#00f3ff]" /> Export Backup
            </button>
            <label className="py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer flex flex-col items-center justify-center gap-1">
              <Upload size={14} className="text-[#bd00ff]" /> Import Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main vault area: Search, categories & Cards */}
      <div className="xl:col-span-3 flex flex-col gap-6">
        {/* Search header */}
        <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-2.5 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search semantic associations in database..."
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#00f3ff]/40"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-5 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] text-slate-950 text-xs font-bold uppercase tracking-wider"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Memories Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[70vh] pr-1">
          {memories.length === 0 ? (
            <div className="col-span-full glass-panel border border-slate-850 p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-3">
              <Brain className="w-8 h-8 text-slate-600 animate-pulse" />
              NO SEMANTIC MEMORY REGISTERS RECORDED.
            </div>
          ) : (
            memories.map((mem) => {
              const categoryColor = 
                mem.category === 'goal' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' :
                mem.category === 'project' ? 'border-[#00f3ff]/20 bg-[#00f3ff]/5 text-[#00f3ff]' :
                mem.category === 'ui_style' ? 'border-[#bd00ff]/20 bg-[#bd00ff]/5 text-[#bd00ff]' :
                mem.category === 'routine' ? 'border-amber-500/20 bg-amber-500/5 text-amber-400' :
                mem.category === 'contact' ? 'border-cyan-400/20 bg-cyan-400/5 text-cyan-400' :
                mem.category === 'business_idea' ? 'border-rose-500/20 bg-rose-500/5 text-rose-400' :
                'border-slate-800 bg-slate-950/20 text-slate-400';

              return (
                <div 
                  key={mem.id}
                  className="glass-panel p-4 border border-slate-850 hover:border-slate-800/80 bg-slate-950/20 rounded-2xl flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest border ${categoryColor}`}>
                        {mem.category}
                      </span>
                      <div className="flex items-center gap-3">
                        {mem.similarity_score !== undefined && (
                          <span className="text-[9px] font-mono text-emerald-400/80">
                            Sim: {(mem.similarity_score * 100).toFixed(0)}%
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-slate-500">
                          Imp: {mem.importance}/10
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="text-xs font-bold font-mono text-white mb-2">{mem.title}</h4>
                    <p className="text-[11px] text-slate-400 font-mono leading-relaxed">{mem.content}</p>
                    
                    {mem.tags && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {mem.tags.split(' ').map((tag, idx) => (
                          <span key={idx} className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-3 mt-3 border-t border-slate-900/60">
                    <span>Recalled: {mem.access_count}x</span>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryVault;
