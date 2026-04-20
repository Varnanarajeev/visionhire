import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Link2, Briefcase, Clock, Zap, Target, FileText, Plus, Trash2 } from 'lucide-react';
import { auth } from '../lib/auth';

const API = 'http://localhost:8000';

interface SavedJD { id: number; title: string; content: string; created_at: string; }

export default function CreateInvitePage() {
    const navigate = useNavigate();
    const [jd, setJd] = useState('');
    const [roundType, setRoundType] = useState('technical');
    const [duration, setDuration] = useState(300);
    const [focusAreas, setFocusAreas] = useState('');
    const [instructions, setInstructions] = useState('');
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ invite_code: string; difficulty: string; link: string } | null>(null);
    const [copied, setCopied] = useState(false);

    // Saved JDs
    const [savedJds, setSavedJds] = useState<SavedJD[]>([]);
    const [showSaveJd, setShowSaveJd] = useState(false);
    const [newJdTitle, setNewJdTitle] = useState('');

    const headers = { Authorization: `Bearer ${auth.getToken()}`, 'Content-Type': 'application/json' };

    useEffect(() => {
        fetch(`${API}/recruiter/jds`, { headers: { Authorization: `Bearer ${auth.getToken()}` } })
            .then(r => r.json()).then(d => setSavedJds(Array.isArray(d) ? d : [])).catch(() => { });
    }, []);

    const createInvite = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/recruiter/invite`, {
                method: 'POST', headers,
                body: JSON.stringify({ job_description: jd, round_type: roundType, duration_secs: duration, focus_areas: focusAreas, custom_instructions: instructions, candidate_email: email }),
            });
            const data = await res.json();
            if (res.ok) setResult(data);
        } catch { }
        finally { setSubmitting(false); }
    };

    const saveJd = async () => {
        if (!newJdTitle.trim() || !jd.trim()) return;
        const res = await fetch(`${API}/recruiter/jds`, { method: 'POST', headers, body: JSON.stringify({ title: newJdTitle, content: jd }) });
        if (res.ok) {
            const d = await res.json();
            setSavedJds(prev => [{ id: d.id, title: newJdTitle, content: jd, created_at: new Date().toISOString() }, ...prev]);
            setShowSaveJd(false); setNewJdTitle('');
        }
    };

    const deleteJd = async (id: number) => {
        await fetch(`${API}/recruiter/jds/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${auth.getToken()}` } });
        setSavedJds(prev => prev.filter(j => j.id !== id));
    };

    const loadJd = (j: SavedJD) => { setJd(j.content); };

    const copyLink = () => {
        if (!result) return;
        navigator.clipboard.writeText(`${window.location.origin}/invite/${result.invite_code}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (result) {
        return (
            <div className="p-6 md:p-8 max-w-lg mx-auto animate-fade-in-up">
                <div className="glass-card p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Interview Created!</h1>
                    <p className="text-slate-500 text-sm mb-6">Share this link with the candidate</p>

                    <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Link2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="text-sm text-white font-mono truncate flex-1 text-left">{window.location.origin}/invite/{result.invite_code}</span>
                        <button onClick={copyLink} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all flex-shrink-0">
                            {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mb-6">
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {roundType}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {duration / 60} min</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {result.difficulty}</span>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => { setResult(null); setJd(''); setEmail(''); setFocusAreas(''); setInstructions(''); }} className="btn-ghost flex-1 text-xs py-2">Create Another</button>
                        <button onClick={() => navigate('/recruiter')} className="btn-primary flex-1 text-xs py-2">Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
                <button onClick={() => navigate('/recruiter')} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></button>
                <div>
                    <h1 className="text-2xl font-black text-white">Schedule Interview</h1>
                    <p className="text-slate-500 text-xs">Configure and create a shareable interview link</p>
                </div>
            </div>

            <div className="space-y-4 animate-fade-in-up">
                {/* Job Description */}
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Job Description</label>
                        <div className="flex gap-2">
                            {savedJds.length > 0 && (
                                <select onChange={e => { const j = savedJds.find(s => s.id === +e.target.value); if (j) loadJd(j); }} className="input-dark text-xs py-1 px-2">
                                    <option value="">Load saved JD...</option>
                                    {savedJds.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                                </select>
                            )}
                            {jd.trim() && (
                                <button onClick={() => setShowSaveJd(!showSaveJd)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Save JD
                                </button>
                            )}
                        </div>
                    </div>
                    <textarea value={jd} onChange={e => setJd(e.target.value)} rows={5} className="input-dark w-full text-sm resize-none" placeholder="Paste the job description here (or leave empty for a general interview)..." />
                    {showSaveJd && (
                        <div className="flex gap-2 mt-2">
                            <input value={newJdTitle} onChange={e => setNewJdTitle(e.target.value)} placeholder="JD title..." className="input-dark flex-1 text-sm py-1.5" />
                            <button onClick={saveJd} className="btn-primary text-xs py-1.5 px-3">Save</button>
                        </div>
                    )}
                    {savedJds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {savedJds.map(j => (
                                <span key={j.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-white/5 text-slate-400 border border-white/5">
                                    {j.title}
                                    <button onClick={() => deleteJd(j.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Round & Duration */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="glass-card p-5">
                        <label className="text-xs text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Round Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['technical', 'hr', 'behavioral'].map(r => (
                                <button key={r} onClick={() => setRoundType(r)}
                                    className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all ${roundType === r ? 'gradient-bg text-white' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="glass-card p-5">
                        <label className="text-xs text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Duration</label>
                        <div className="grid grid-cols-5 gap-2">
                            {[{ label: '1 min', val: 60 }, { label: '3 min', val: 180 }, { label: '5 min', val: 300 }, { label: '10 min', val: 600 }, { label: '15 min', val: 900 }].map(d => (
                                <button key={d.val} onClick={() => setDuration(d.val)}
                                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${duration === d.val ? 'gradient-bg text-white' : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'}`}>
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Focus & Instructions */}
                <div className="glass-card p-5">
                    <label className="text-xs text-slate-500 uppercase tracking-widest mb-3 block">Focus Areas (optional)</label>
                    <input value={focusAreas} onChange={e => setFocusAreas(e.target.value)} className="input-dark w-full text-sm mb-4" placeholder="e.g., React, System Design, AWS (comma-separated)" />
                    <label className="text-xs text-slate-500 uppercase tracking-widest mb-3 block">Custom Instructions for AI (optional)</label>
                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} className="input-dark w-full text-sm resize-none" placeholder="e.g., 'Test their leadership skills deeply'" />
                </div>

                {/* Candidate Email */}
                <div className="glass-card p-5">
                    <label className="text-xs text-slate-500 uppercase tracking-widest mb-3 block">Candidate Email (optional — for tracking)</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="input-dark w-full text-sm" placeholder="candidate@example.com" />
                </div>

                {/* Submit */}
                <button onClick={createInvite} disabled={submitting} className="btn-primary w-full py-3 text-sm gap-2">
                    {submitting ? 'Creating...' : <><Link2 className="w-4 h-4" /> Generate Interview Link</>}
                </button>
            </div>
        </div>
    );
}
