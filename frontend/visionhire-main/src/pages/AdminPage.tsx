import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, BarChart3, CheckCircle, Clock, RefreshCw, ShieldAlert,
    Zap, Trash2, Ban, Shield, Download, Settings, FileText,
    RotateCcw, Activity, Search, X, ChevronDown, ChevronUp, Save
} from 'lucide-react';
import { auth } from '../lib/auth';

const API = 'http://localhost:8000';
const ADMIN_EMAIL_KEY = 'admin@visionhire.com'; // fallback for UI check

// ─── Types ───
interface Stats {
    total_users: number; total_sessions: number; completed_sessions: number;
    banned_users: number; avg_score: number | null;
    verdict_breakdown: Record<string, number>;
    score_distribution: Record<string, number>;
    daily_signups: { day: string; count: number }[];
}
interface UserRow { id: number; email: string; full_name: string; is_banned: number; created_at: string; session_count: number; }
interface SessionRow { session_id: string; question_count: number; max_questions: number; created_at: string; final_score: number | null; verdict: string | null; user_email: string; full_name: string; }
interface AuditRow { id: number; event: string; email: string; detail: string; created_at: string; }
interface AdminSettings { max_questions: number; announcement: string; admin_emails: string; }

// ─── Helpers ───
const fmt = (dt: string) => dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const verdictColor = (v: string) => {
    const l = (v || '').toLowerCase();
    if (l.includes('strongly') || l.includes('strong consider')) return 'text-emerald-400';
    if (l.includes('shortlist')) return 'text-blue-400';
    if (l.includes('strong reject')) return 'text-red-500';
    if (l.includes('reject')) return 'text-red-400';
    return 'text-amber-400';
};

function Toast({ msg, type, onDone }: { msg: string; type: 'ok' | 'err'; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
    return (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl animate-fade-in-up ${type === 'ok' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {type === 'ok' ? '✓' : '✕'} {msg}
        </div>
    );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="relative glass-card w-full max-w-2xl max-h-[80vh] overflow-auto p-6 z-50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Mini bar chart (pure CSS) ───
function BarChart({ data }: { data: Record<string, number> }) {
    const max = Math.max(...Object.values(data), 1);
    return (
        <div className="flex items-end gap-2 h-20">
            {Object.entries(data).map(([label, val]) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-white font-bold">{val}</span>
                    <div className="w-full rounded-t progress-fill" style={{ height: `${(val / max) * 60}px`, minHeight: 2 }} />
                    <span className="text-xs text-slate-600 text-center">{label}</span>
                </div>
            ))}
        </div>
    );
}

export default function AdminPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [audit, setAudit] = useState<AuditRow[]>([]);
    const [settings, setSettings] = useState<AdminSettings>({ max_questions: 3, announcement: '', admin_emails: '' });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'sessions' | 'analytics' | 'settings' | 'audit'>('overview');
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
    const [reportModal, setReportModal] = useState<{ sessionId: string; data: string } | null>(null);
    const [searchUser, setSearchUser] = useState('');
    const [expandedUser, setExpandedUser] = useState<number | null>(null);
    const [userEmail] = useState(auth.getUserEmail() || '');
    const [userRole] = useState(localStorage.getItem('userRole') || '');

    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => setToast({ msg, type });

    const apiHeaders = { Authorization: `Bearer ${auth.getToken()}` };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [s, u, sess, a, cfg] = await Promise.all([
                fetch(`${API}/admin/stats`, { headers: apiHeaders }).then(r => r.json()),
                fetch(`${API}/admin/users`, { headers: apiHeaders }).then(r => r.json()),
                fetch(`${API}/admin/sessions`, { headers: apiHeaders }).then(r => r.json()),
                fetch(`${API}/admin/audit-log`, { headers: apiHeaders }).then(r => r.json()),
                fetch(`${API}/admin/settings`, { headers: apiHeaders }).then(r => r.json()),
            ]);
            setStats(s); setUsers(Array.isArray(u) ? u : []); setSessions(Array.isArray(sess) ? sess : []);
            setAudit(Array.isArray(a) ? a : []); setSettings(cfg);
        } catch { showToast('Failed to load admin data', 'err'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, []);

    // ─── Actions ───
    const deleteUser = async (id: number, email: string) => {
        if (!confirm(`Permanently delete ${email} and all their data?`)) return;
        const r = await fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers: apiHeaders });
        if (r.ok) { showToast('User deleted'); fetchAll(); } else showToast('Delete failed', 'err');
    };

    const toggleBan = async (u: UserRow) => {
        const endpoint = u.is_banned ? 'unban' : 'ban';
        const r = await fetch(`${API}/admin/users/${u.id}/${endpoint}`, { method: 'POST', headers: apiHeaders });
        if (r.ok) { showToast(`User ${u.is_banned ? 'unbanned' : 'banned'}`); fetchAll(); } else showToast('Action failed', 'err');
    };

    const resetSession = async (sid: string) => {
        if (!confirm('Reset this session? All history will be cleared.')) return;
        const r = await fetch(`${API}/admin/sessions/${sid}/reset`, { method: 'POST', headers: apiHeaders });
        if (r.ok) { showToast('Session reset'); fetchAll(); } else showToast('Reset failed', 'err');
    };

    const viewReport = async (sid: string) => {
        const r = await fetch(`${API}/admin/sessions/${sid}/report`, { headers: apiHeaders });
        if (r.ok) { const d = await r.json(); setReportModal({ sessionId: sid, data: d.report }); }
        else showToast('No report stored for this session', 'err');
    };

    const exportCSV = () => {
        window.open(`${API}/admin/export/csv?token=${auth.getToken()}`, '_blank');
        fetch(`${API}/admin/export/csv`, { headers: apiHeaders }).then(async r => {
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'visionhire_export.csv'; a.click();
        }).catch(() => showToast('Export failed', 'err'));
    };

    const saveSettings = async () => {
        const r = await fetch(`${API}/admin/settings`, {
            method: 'POST',
            headers: { ...apiHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        if (r.ok) showToast('Settings saved!'); else showToast('Save failed', 'err');
    };

    // Access guard — allow by role='admin' OR by email whitelist
    const adminEmails = (settings.admin_emails || ADMIN_EMAIL_KEY).split(',').map(e => e.trim());
    const isAdmin = userRole === 'admin' || adminEmails.includes(userEmail) || userEmail === ADMIN_EMAIL_KEY;

    if (!isAdmin && !loading) {
        return (
            <div className="p-10 max-w-lg mx-auto text-center animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <ShieldAlert className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
                <p className="text-slate-500 mb-6">Admin accounts only.</p>
                <button onClick={() => navigate('/home')} className="btn-ghost">Back to Dashboard</button>
            </div>
        );
    }

    const completionRate = stats ? Math.round((stats.completed_sessions / Math.max(stats.total_sessions, 1)) * 100) : 0;
    const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchUser.toLowerCase()) || (u.full_name || '').toLowerCase().includes(searchUser.toLowerCase()));

    const TABS = [
        { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
        { key: 'users', label: `Users (${users.length})`, icon: <Users className="w-4 h-4" /> },
        { key: 'sessions', label: `Sessions (${sessions.length})`, icon: <Clock className="w-4 h-4" /> },
        { key: 'analytics', label: 'Analytics', icon: <Activity className="w-4 h-4" /> },
        { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
        { key: 'audit', label: 'Audit Log', icon: <FileText className="w-4 h-4" /> },
    ] as const;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
            {reportModal && (
                <Modal title={`Report — ${reportModal.sessionId.slice(0, 8)}…`} onClose={() => setReportModal(null)}>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed overflow-auto max-h-96">
                        {JSON.stringify(JSON.parse(reportModal.data), null, 2)}
                    </pre>
                </Modal>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.4),rgba(217,119,6,0.3))' }}>
                        <Shield className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">Admin Console</h1>
                        <p className="text-slate-500 text-xs">Platform-wide monitoring & control</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={exportCSV} className="btn-ghost text-xs py-2 px-3 gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                    <button onClick={fetchAll} disabled={loading} className="btn-ghost text-xs py-2 px-3 gap-1.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 animate-fade-in-up">
                {[
                    { label: 'Users', value: stats?.total_users ?? '—', icon: <Users className="w-4 h-4 text-indigo-400" /> },
                    { label: 'Sessions', value: stats?.total_sessions ?? '—', icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
                    { label: 'Completed', value: stats?.completed_sessions ?? '—', icon: <CheckCircle className="w-4 h-4 text-blue-400" /> },
                    { label: 'Banned', value: stats?.banned_users ?? '—', icon: <Ban className="w-4 h-4 text-red-400" /> },
                    { label: 'Avg Score', value: stats?.avg_score ? `${stats.avg_score}%` : '—', icon: <Zap className="w-4 h-4 text-amber-400" /> },
                ].map(c => (
                    <div key={c.label} className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-1.5">{c.icon}<span className="text-xs text-slate-600 uppercase tracking-widest">{c.label}</span></div>
                        <p className="text-2xl font-black text-white">{loading ? '…' : c.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl w-full overflow-x-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-1 justify-center ${activeTab === t.key ? 'text-white gradient-bg' : 'text-slate-500 hover:text-white'}`}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4 animate-fade-in-up">
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-white mb-4">Platform Health</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Interview Completion Rate', val: completionRate, color: 'progress-fill' },
                                { label: 'Active Users (have sessions)', val: stats ? Math.round((users.filter(u => u.session_count > 0).length / Math.max(stats.total_users, 1)) * 100) : 0, color: 'bg-emerald-500' },
                                { label: 'Good Scores (≥60%)', val: stats ? Math.round(((stats.score_distribution?.['61-80'] || 0) + (stats.score_distribution?.['81-100'] || 0)) / Math.max(stats.completed_sessions, 1) * 100) : 0, color: 'bg-amber-500' },
                            ].map(b => (
                                <div key={b.label}>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{b.label}</span><span className="text-white font-bold">{b.val}%</span></div>
                                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                        <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.val}%`, transition: 'width 1s ease' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-white mb-4">Verdict Breakdown</h3>
                        {stats?.verdict_breakdown && Object.keys(stats.verdict_breakdown).length > 0 ? (
                            <div className="space-y-2">
                                {Object.entries(stats.verdict_breakdown).map(([v, c]) => (
                                    <div key={v} className="flex items-center justify-between">
                                        <span className={`text-sm font-semibold ${verdictColor(v)}`}>{v}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                <div className="h-full progress-fill rounded-full" style={{ width: `${(c / Math.max(...Object.values(stats.verdict_breakdown))) * 100}%` }} />
                                            </div>
                                            <span className="text-white font-bold text-sm w-6 text-right">{c}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-slate-600 text-sm">No completed interviews yet</p>}
                    </div>
                </div>
            )}

            {/* ── Users Tab ── */}
            {activeTab === 'users' && (
                <div className="animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input value={searchUser} onChange={e => setSearchUser(e.target.value)}
                                placeholder="Search users…"
                                className="input-dark w-full pl-9 py-2 text-sm" />
                        </div>
                    </div>
                    <div className="glass-card overflow-hidden">
                        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            {filteredUsers.map(u => (
                                <div key={u.id}>
                                    <div className="flex items-center justify-between px-5 py-3 hover:bg-white/5 cursor-pointer" onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${u.is_banned ? 'bg-red-500/20' : 'gradient-bg'}`}>
                                                {u.is_banned ? <Ban className="w-4 h-4 text-red-400" /> : u.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${u.is_banned ? 'text-red-400 line-through' : 'text-white'}`}>{u.full_name || u.email.split('@')[0]}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-slate-500">{u.session_count} sessions</span>
                                            <span className="text-xs text-slate-600">{fmt(u.created_at)}</span>
                                            {expandedUser === u.id ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                        </div>
                                    </div>
                                    {expandedUser === u.id && (
                                        <div className="px-5 py-3 flex gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <button onClick={() => toggleBan(u)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${u.is_banned ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-400 hover:bg-amber-500/10'}`}>
                                                {u.is_banned ? <><Shield className="w-3.5 h-3.5" /> Unban</> : <><Ban className="w-3.5 h-3.5" /> Ban</>}
                                            </button>
                                            <button onClick={() => deleteUser(u.id, u.email)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all">
                                                <Trash2 className="w-3.5 h-3.5" /> Delete Account
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filteredUsers.length === 0 && <div className="px-5 py-10 text-center text-slate-600 text-sm">No users found</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sessions Tab ── */}
            {activeTab === 'sessions' && (
                <div className="glass-card overflow-hidden animate-fade-in-up">
                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="grid grid-cols-5 gap-2 px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-widest">
                            <span className="col-span-2">User</span><span>Progress</span><span>Score/Verdict</span><span>Actions</span>
                        </div>
                        {sessions.map(s => {
                            const done = s.question_count >= s.max_questions;
                            return (
                                <div key={s.session_id} className="grid grid-cols-5 gap-2 px-5 py-3 items-center hover:bg-white/5">
                                    <div className="col-span-2 flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${done ? 'bg-emerald-500/20' : 'gradient-bg opacity-70'}`}>
                                            {done ? '✓' : `Q${s.question_count}`}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-white truncate">{s.full_name || s.user_email?.split('@')[0] || 'Unknown'}</p>
                                            <p className="text-xs text-slate-600 truncate">{s.user_email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            <div className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'progress-fill'}`} style={{ width: `${(s.question_count / s.max_questions) * 100}%` }} />
                                        </div>
                                        <span className="text-xs text-slate-500">{s.question_count}/{s.max_questions}</span>
                                    </div>
                                    <div>
                                        {s.final_score ? <span className="text-sm font-black text-white">{s.final_score}%</span> : <span className="text-xs text-slate-600">—</span>}
                                        {s.verdict && <p className={`text-xs font-semibold ${verdictColor(s.verdict)}`}>{s.verdict}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => viewReport(s.session_id)} title="View Report"
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                                            <FileText className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => resetSession(s.session_id)} title="Reset Session"
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {sessions.length === 0 && <div className="px-5 py-10 text-center text-slate-600 text-sm">No sessions yet</div>}
                    </div>
                </div>
            )}

            {/* ── Analytics Tab ── */}
            {activeTab === 'analytics' && (
                <div className="grid md:grid-cols-2 gap-4 animate-fade-in-up">
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-white mb-4">Score Distribution</h3>
                        {stats?.score_distribution ? <BarChart data={stats.score_distribution} /> : <p className="text-slate-600 text-sm">No data yet</p>}
                    </div>
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-white mb-4">Daily Signups (Last 7 Days)</h3>
                        {stats?.daily_signups && stats.daily_signups.length > 0 ? (
                            <BarChart data={Object.fromEntries(stats.daily_signups.map(d => [d.day.slice(5), d.count]))} />
                        ) : <p className="text-slate-600 text-sm">No signups in last 7 days</p>}
                    </div>
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-white mb-4">Verdict Breakdown</h3>
                        {stats?.verdict_breakdown && Object.keys(stats.verdict_breakdown).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(stats.verdict_breakdown).map(([v, c]) => {
                                    const total = Object.values(stats.verdict_breakdown).reduce((a, b) => a + b, 0);
                                    return (
                                        <div key={v} className="flex items-center gap-3">
                                            <span className={`text-xs font-bold w-28 flex-shrink-0 ${verdictColor(v)}`}>{v}</span>
                                            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                <div className="h-full progress-fill rounded-full" style={{ width: `${(c / total) * 100}%` }} />
                                            </div>
                                            <span className="text-white font-black text-sm w-8 text-right">{c}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <p className="text-slate-600 text-sm">No completed interviews yet</p>}
                    </div>
                    <div className="glass-card p-5">
                        <h3 className="font-bold text-white mb-4">Key Metrics</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Average Score', value: stats?.avg_score ? `${stats.avg_score}%` : 'No data' },
                                { label: 'Completion Rate', value: `${completionRate}%` },
                                { label: 'Banned Users', value: stats?.banned_users ?? 0 },
                                { label: 'Sessions per User', value: stats ? (stats.total_sessions / Math.max(stats.total_users, 1)).toFixed(1) : '—' },
                            ].map(m => (
                                <div key={m.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span className="text-sm text-slate-400">{m.label}</span>
                                    <span className="text-sm font-black text-white">{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Settings Tab ── */}
            {activeTab === 'settings' && (
                <div className="max-w-xl animate-fade-in-up space-y-4">
                    <div className="glass-card p-6 space-y-5">
                        <h3 className="font-bold text-white">Platform Settings</h3>
                        <div>
                            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Max Interview Questions</label>
                            <div className="flex items-center gap-4">
                                <input type="range" min={1} max={10} value={settings.max_questions}
                                    onChange={e => setSettings(s => ({ ...s, max_questions: +e.target.value }))}
                                    className="flex-1 accent-indigo-500" />
                                <span className="text-white font-black text-lg w-6">{settings.max_questions}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">Currently: {settings.max_questions} questions per interview</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Announcement Banner</label>
                            <textarea value={settings.announcement}
                                onChange={e => setSettings(s => ({ ...s, announcement: e.target.value }))}
                                placeholder="Leave empty to hide banner (shown to all users)"
                                rows={3} className="input-dark w-full text-sm resize-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Admin Emails (comma-separated)</label>
                            <input value={settings.admin_emails}
                                onChange={e => setSettings(s => ({ ...s, admin_emails: e.target.value }))}
                                className="input-dark w-full text-sm"
                                placeholder="admin@visionhire.com, you@email.com" />
                        </div>
                        <button onClick={saveSettings} className="btn-primary w-full">
                            <Save className="w-4 h-4" /> Save Settings
                        </button>
                    </div>
                </div>
            )}

            {/* ── Audit Log Tab ── */}
            {activeTab === 'audit' && (
                <div className="glass-card overflow-hidden animate-fade-in-up">
                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="grid grid-cols-4 gap-2 px-5 py-3 text-xs font-bold text-slate-600 uppercase tracking-widest">
                            <span>Event</span><span>Email</span><span>Detail</span><span>Time</span>
                        </div>
                        {audit.map(a => (
                            <div key={a.id} className="grid grid-cols-4 gap-2 px-5 py-3 hover:bg-white/5">
                                <span className={`text-xs font-semibold ${a.event.includes('fail') || a.event.includes('ban') || a.event.includes('delete') ? 'text-red-400' : a.event.includes('admin') ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {a.event}
                                </span>
                                <span className="text-xs text-slate-400 truncate">{a.email || '—'}</span>
                                <span className="text-xs text-slate-600 truncate">{a.detail || '—'}</span>
                                <span className="text-xs text-slate-600">{fmt(a.created_at)}</span>
                            </div>
                        ))}
                        {audit.length === 0 && <div className="px-5 py-10 text-center text-slate-600 text-sm">No events logged yet</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
