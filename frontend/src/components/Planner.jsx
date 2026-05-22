import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Calendar, Clock } from 'lucide-react';

const Planner = () => {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/planner');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          time: newTime || null,
          priority: priority
        })
      });
      if (response.ok) {
        setNewTitle('');
        setNewTime('');
        fetchTasks();
      }
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const response = await fetch(`/api/planner/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await fetch(`/api/planner/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="glass-panel p-5 flex flex-col h-[340px] overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/10">
        <h2 className="text-xs font-mono font-bold tracking-[0.2em] text-[#00f3ff] flex items-center gap-2">
          <Calendar size={14} /> DAILY SCHEDULER
        </h2>
        <span className="text-[10px] font-mono text-slate-500">
          TASKS: {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-500 font-mono text-xs">
            NO OBJECTIVES FOR TODAY
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-300 ${
                task.status === 'completed' 
                  ? 'bg-emerald-950/10 border-emerald-500/20 opacity-60' 
                  : 'bg-slate-950/30 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => toggleTask(task.id, task.status)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    task.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-slate-600 hover:border-cyan-400'
                  }`}
                >
                  {task.status === 'completed' && <Check size={10} strokeWidth={3} />}
                </button>
                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                    {task.title}
                  </p>
                  {task.scheduled_time && (
                    <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={8} /> {task.scheduled_time}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono border ${
                  task.priority === 'high' 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : task.priority === 'medium'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                }`}>
                  {task.priority.toUpperCase()}
                </span>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="flex gap-2">
        <input 
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New core objective..."
          className="flex-1 bg-slate-950/50 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/40"
        />
        <input 
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          className="w-20 bg-slate-950/50 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-400 focus:outline-none focus:border-cyan-500/40"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 p-1.5 rounded transition-all"
        >
          <Plus size={14} />
        </button>
      </form>
    </div>
  );
};

export default Planner;
