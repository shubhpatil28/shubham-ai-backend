import React, { useState, useEffect } from 'react';
import { Send, Calendar, Users, Shield, MessageSquare, Trash2, Plus, RefreshCw, Upload, FileText } from 'lucide-react';
import { API_URL } from '../config/api';

const WhatsAppHub = ({ onLog }) => {
  const [status, setStatus] = useState('offline');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // Nickname Form
  const [newNickname, setNewNickname] = useState('');
  const [newContactName, setNewContactName] = useState('');
  
  // Send message Form
  const [targetContact, setTargetContact] = useState('');
  const [directMsg, setDirectMsg] = useState('');
  
  // Schedule Form
  const [schedContact, setSchedContact] = useState('');
  const [schedMsg, setSchedMsg] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedFile, setSchedFile] = useState('');

  // Status Upload
  const [statusFilePath, setStatusFilePath] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data.driver_status);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/contacts`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/schedule`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchContacts();
    fetchSchedules();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenWhatsApp = async () => {
    setLoading(true);
    if (onLog) onLog("Launching WhatsApp Web persistent driver...", "action");
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/open`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (onLog) onLog(data.message, "response");
        fetchStatus();
      }
    } catch (e) {
      if (onLog) onLog("Failed to open WhatsApp.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newNickname || !newContactName) return;
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: newNickname, contact_name: newContactName })
      });
      if (res.ok) {
        setNewNickname('');
        setNewContactName('');
        fetchContacts();
        if (onLog) onLog(`Mapped nickname '${newNickname}' to '${newContactName}'`, "system");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchContacts();
        if (onLog) onLog("Contact mapping deleted.", "system");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendDirect = async (e) => {
    e.preventDefault();
    if (!targetContact || !directMsg) return;
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: targetContact, message: directMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setDirectMsg('');
        if (onLog) onLog(data.message, "response");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!schedContact || !schedMsg || !schedTime) return;
    
    // Format local datetime-local value (YYYY-MM-DDTHH:MM) to backend format (YYYY-MM-DD HH:MM:SS)
    const formattedTime = schedTime.replace('T', ' ') + ':00';

    try {
      const res = await fetch(`${API_URL}/api/whatsapp/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: schedContact,
          message: schedMsg,
          scheduled_time: formattedTime,
          file_path: schedFile || null
        })
      });
      if (res.ok) {
        setSchedContact('');
        setSchedMsg('');
        setSchedTime('');
        setSchedFile('');
        fetchSchedules();
        if (onLog) onLog(`Message scheduled for ${schedContact} at ${formattedTime}`, "system");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSchedule = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/schedule/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSchedules();
        if (onLog) onLog("Scheduled message cancelled.", "system");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadStatus = async (e) => {
    e.preventDefault();
    if (!statusFilePath) return;
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/upload-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: statusFilePath })
      });
      if (res.ok) {
        const data = await res.json();
        setStatusFilePath('');
        if (onLog) onLog(data.message, "response");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-full overflow-y-auto">
      {/* Col 1: System Status & Direct Messenger */}
      <div className="flex flex-col gap-6">
        {/* Status Card */}
        <div className="glass-panel p-5 relative overflow-hidden border border-slate-800/60 bg-slate-950/40 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Shield className="text-[#00f3ff] w-4 h-4" /> Selenium Controller
            </h3>
            <button 
              onClick={fetchStatus} 
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-3.5 h-3.5 rounded-full ${
              status === 'online' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' :
              status === 'idle' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' : 'bg-rose-500 shadow-lg shadow-rose-500/50'
            }`} />
            <div>
              <div className="text-xs font-bold font-mono tracking-wide text-white uppercase">{status}</div>
              <div className="text-[10px] text-slate-500 font-mono">Profile: ShubhamAI_Chrome_Profile</div>
            </div>
          </div>

          <button
            onClick={handleOpenWhatsApp}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border border-[#00f3ff]/20 bg-[#00f3ff]/5 text-[#00f3ff] hover:bg-[#00f3ff]/10 text-xs font-mono font-bold uppercase transition-all tracking-wider disabled:opacity-50"
          >
            {loading ? 'Initializing Webdriver...' : 'Launch WhatsApp Browser'}
          </button>
        </div>

        {/* Direct Text Messenger */}
        <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl">
          <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
            <MessageSquare className="text-[#bd00ff] w-4 h-4" /> Direct Transmit
          </h3>
          <form onSubmit={handleSendDirect} className="space-y-4">
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Recipient Name / Nickname</label>
              <input
                type="text"
                required
                value={targetContact}
                onChange={(e) => setTargetContact(e.target.value)}
                placeholder="Aai, Rahul, or +919876543210..."
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00f3ff]/40"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Message Content</label>
              <textarea
                required
                value={directMsg}
                onChange={(e) => setDirectMsg(e.target.value)}
                placeholder="Type your message..."
                rows="3"
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00f3ff]/40 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#0066ff] text-slate-950 hover:shadow-lg hover:shadow-[#00f3ff]/20 text-xs font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-2"
            >
              <Send size={14} /> Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Col 2: Nickname Mapping (Contact Memory) */}
      <div className="flex flex-col gap-6">
        <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
              <Users className="text-emerald-400 w-4 h-4" /> Contact Nicknames
            </h3>
            
            <div className="space-y-3.5 overflow-y-auto max-h-[300px] pr-1">
              {contacts.length === 0 ? (
                <div className="text-center text-slate-600 font-mono text-[10px] py-12">
                  NO CONTACT NICKNAMES REGISTERED YET.
                </div>
              ) : (
                contacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-850 bg-slate-950/30 font-mono text-xs"
                  >
                    <div>
                      <span className="text-[#00f3ff] font-bold">"{contact.nickname}"</span>
                      <span className="text-slate-500 mx-2">→</span>
                      <span className="text-slate-300">{contact.contact_name}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleAddContact} className="mt-5 border-t border-slate-900 pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Nickname"
                className="bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00f3ff]/40"
              />
              <input
                type="text"
                required
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="WhatsApp Name"
                className="bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00f3ff]/40"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Map Nickname
            </button>
          </form>
        </div>

        {/* Status File Uploader */}
        <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl">
          <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
            <Upload className="text-cyan-400 w-4 h-4" /> Status Broadcast
          </h3>
          <form onSubmit={handleUploadStatus} className="space-y-4">
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Local Absolute File Path</label>
              <input
                type="text"
                required
                value={statusFilePath}
                onChange={(e) => setStatusFilePath(e.target.value)}
                placeholder="C:\Users\Hp\Pictures\status.jpg"
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#00f3ff]/40"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-2"
            >
              <Upload size={14} /> Upload status
            </button>
          </form>
        </div>
      </div>

      {/* Col 3: Scheduler Module */}
      <div className="glass-panel p-5 border border-slate-800/60 bg-slate-950/40 rounded-2xl flex flex-col justify-between">
        <div>
          <h3 className="font-mono text-xs font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
            <Calendar className="text-[#00f3ff] w-4 h-4" /> Scheduled Messages
          </h3>

          <div className="space-y-3.5 overflow-y-auto max-h-[280px] pr-1">
            {schedules.length === 0 ? (
              <div className="text-center text-slate-600 font-mono text-[10px] py-16">
                NO CRON ACTIONS SCHEDULED.
              </div>
            ) : (
              schedules.map((sch) => (
                <div 
                  key={sch.id}
                  className="p-3 rounded-xl border border-slate-850 bg-slate-950/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#00f3ff]">{sch.recipient}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                      sch.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      sch.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                    }`}>{sch.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono line-clamp-2">"{sch.message}"</p>
                  {sch.file_path && (
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 truncate">
                      <FileText size={10} /> {sch.file_path}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-900/50">
                    <span>{sch.scheduled_time}</span>
                    <button 
                      onClick={() => handleDeleteSchedule(sch.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleAddSchedule} className="mt-5 border-t border-slate-900 pt-4 space-y-3">
          <div>
            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">To (Name / Phone)</label>
            <input
              type="text"
              required
              value={schedContact}
              onChange={(e) => setSchedContact(e.target.value)}
              placeholder="Rahul or +91..."
              className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Message</label>
            <input
              type="text"
              required
              value={schedMsg}
              onChange={(e) => setSchedMsg(e.target.value)}
              placeholder="Good morning!"
              className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Scheduled Time</label>
              <input
                type="datetime-local"
                required
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-2 py-1.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">File Path (Optional)</label>
              <input
                type="text"
                value={schedFile}
                onChange={(e) => setSchedFile(e.target.value)}
                placeholder="C:\image.jpg"
                className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-2 py-1.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] text-slate-950 hover:shadow-lg text-xs font-bold uppercase transition-all tracking-wider flex items-center justify-center gap-1.5"
          >
            <Calendar size={14} /> Schedule Action
          </button>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppHub;
