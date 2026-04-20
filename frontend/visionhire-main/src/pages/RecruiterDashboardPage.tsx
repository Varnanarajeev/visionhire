import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, RefreshCw, Plus, Link2, AlertCircle,
    CheckCircle, Copy, Eye, Briefcase, Zap, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { auth } from '../lib/auth';

const API = 'http://localhost:8000';

interface Stats { total_invites: number; completed: number; pending: number; avg_score: number | null; }
interface Invite {
    id: number; invite_code: string; candidate_email: string; round_type: string;
    duration_secs: number; difficulty: string; focus_areas: string; status: string;
    created_at: string; session_id: string | null; final_score: number | null; verdict: string | null;
}

const fmt = (dt: string) => dt ? new Date(dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const statusBadge = (s: string) => {
    if (s === 'completed') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (s === 'in_progress') return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
};

function Toast({ msg, type, onDone }: { msg: string; type: 'ok' | 'err'; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
    return (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl animate-fade-in-up ${type === 'ok' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
            {type === 'ok' ? '✓' : '✕'} {msg}
        </div>
    );
}

function ReportModal({ invite, onClose }: { invite: Invite; onClose: () => void }) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/recruiter/invite/${invite.invite_code}/report`, {
            headers: { Authorization: `Bearer ${auth.getToken()}` }
        }).then(r => r.json()).then(d => {
            try {
                setReport(JSON.parse(d.report));
            } catch {
                setReport({ error: "Could not parse report data." });
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const renderScore = (label: string, score: number) => {
        const color = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-indigo-400' : score >= 40 ? 'bg-amber-400' : 'bg-red-400';
        return (
            <div key={label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 capitalize">{label.replace('_', ' ')}</span>
                    <span className="text-white font-bold">{score}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${score || 0}%`, transition: 'width 1s ease' }} />
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="relative glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 z-50 animate-fade-in-up">
                <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-400" />
                            Interview Report — {invite.invite_code}
                        </h3>
                        {report?.candidate_name && <p className="text-sm text-slate-400 mt-1">Candidate: <span className="text-white font-semibold">{report.candidate_name}</span></p>}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"><X className="w-5 h-5" /></button>
                </div>

                {loading ? (
                    <div className="py-10 text-center"><p className="text-slate-500 animate-pulse">Loading report analysis...</p></div>
                ) : !report ? (
                    <div className="py-10 text-center"><p className="text-slate-500">No report available yet.</p></div>
                ) : report.error ? (
                    <div className="py-10 text-center"><p className="text-red-400">{report.error}</p></div>
                ) : (
                    <div className="space-y-6">
                        {/* Scores Section */}
                        <div>
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-400" /> Performance Breakdown</h4>
                            <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
                                {['technical_score', 'resume_score', 'communication_score', 'professionalism_score', 'jd_match_score'].map(s =>
                                    report[s] !== undefined ? renderScore(s.replace('_score', ''), report[s]) : null
                                )}
                            </div>
                        </div>

                        {/* Text Analysis */}
                        {(report.executive_summary || report.overall_feedback || report.jd_analysis) && (
                            <div className="grid md:grid-cols-2 gap-4">
                                {report.jd_analysis && (
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">JD Alignment</h4>
                                        <p className="text-sm text-slate-300 leading-relaxed">{report.jd_analysis}</p>
                                    </div>
                                )}
                                {(report.executive_summary || report.overall_feedback) && (
                                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2">Executive Summary</h4>
                                        <p className="text-sm text-slate-300 leading-relaxed">{report.executive_summary || report.overall_feedback}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Detailed Strengths & Weaknesses */}
                        {((Array.isArray(report.key_strengths) && report.key_strengths.length > 0) || (Array.isArray(report.areas_for_improvement) && report.areas_for_improvement.length > 0)) && (
                            <div className="grid md:grid-cols-2 gap-6">
                                {Array.isArray(report.key_strengths) && report.key_strengths.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Key Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {report.key_strengths.map((str: string, i: number) => (
                                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                    <span className="text-emerald-500 mt-1">•</span>
                                                    <span>{str}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {Array.isArray(report.areas_for_improvement) && report.areas_for_improvement.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> Areas for Improvement
                                        </h4>
                                        <ul className="space-y-2">
                                            {report.areas_for_improvement.map((str: string, i: number) => (
                                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                                    <span className="text-red-500 mt-1">•</span>
                                                    <span>{str}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Star Ratings (Soft Skills) */}
                        {report.star_ratings && typeof report.star_ratings === 'object' && Object.keys(report.star_ratings).length > 0 && (
                            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">Soft Skills Observation</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {Object.entries(report.star_ratings).map(([skill, rating]: [string, any]) => (
                                        <div key={skill} className="flex flex-col">
                                            <span className="text-xs text-slate-400 capitalize mb-1">{skill.replace('_', ' ')}</span>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} className={`text-base ${(typeof rating === 'number' ? rating : 0) >= star ? 'text-amber-400' : 'text-slate-600'}`}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Skill Recommendations */}
                        {Array.isArray(report.skill_recommendations) && report.skill_recommendations.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-400" /> Skill Recommendations</h4>
                                <div className="space-y-2">
                                    {report.skill_recommendations.map((rec: any, i: number) => (
                                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-white">{rec.skill || 'Recommended Skill'}</p>
                                                {rec.url && (
                                                    <a href={rec.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mt-1">
                                                        {rec.resource_name || 'View Resource'} <Link2 className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Removed Raw JSON Fallback */}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function RecruiterDashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [reportInvite, setReportInvite] = useState<Invite | null>(null);

    const headers = { Authorization: `Bearer ${auth.getToken()}` };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [s, inv] = await Promise.all([
                fetch(`${API}/recruiter/stats`, { headers }).then(r => r.json()),
                fetch(`${API}/recruiter/invites`, { headers }).then(r => r.json()),
            ]);
            setStats(s);
            setInvites(Array.isArray(inv) ? inv : []);
        } catch { setToast({ msg: 'Failed to load data', type: 'err' }); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAll(); }, []);

    const copyLink = (code: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/invite/${code}`);
        setToast({ msg: 'Invite link copied!', type: 'ok' });
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
            {reportInvite && <ReportModal invite={reportInvite} onClose={() => setReportInvite(null)} />}

            {/* Header */}
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.4),rgba(79,70,229,0.3))' }}>
                        <Briefcase className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">Recruiter Dashboard</h1>
                        <p className="text-slate-500 text-xs">Manage interviews & view candidate performance</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/recruiter/create')} className="btn-primary text-xs py-2 px-4 gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Create Interview
                    </button>
                    <button onClick={fetchAll} disabled={loading} className="btn-ghost text-xs py-2 px-3 gap-1.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 animate-fade-in-up">
                {[
                    { label: 'Total Invites', value: stats?.total_invites ?? '—', icon: <Link2 className="w-4 h-4 text-indigo-400" /> },
                    { label: 'Completed', value: stats?.completed ?? '—', icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> },
                    { label: 'Pending', value: stats?.pending ?? '—', icon: <Clock className="w-4 h-4 text-amber-400" /> },
                    { label: 'Avg Score', value: stats?.avg_score ? `${stats.avg_score}%` : '—', icon: <Zap className="w-4 h-4 text-blue-400" /> },
                ].map(c => (
                    <div key={c.label} className="glass-card p-4">
                        <div className="flex items-center gap-2 mb-1.5">{c.icon}<span className="text-xs text-slate-600 uppercase tracking-widest">{c.label}</span></div>
                        <p className="text-2xl font-black text-white">{loading ? '…' : c.value}</p>
                    </div>
                ))}
            </div>

            {/* Invites Table */}
            <div className="glass-card overflow-hidden animate-fade-in-up">
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="font-bold text-white text-sm">Interview Invites</h3>
                    <span className="text-xs text-slate-500">{invites.length} total</span>
                </div>

                {invites.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm mb-4">No interviews scheduled yet</p>
                        <button onClick={() => navigate('/recruiter/create')} className="btn-primary text-xs py-2 px-4 gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Schedule First Interview
                        </button>
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        {invites.map(inv => (
                            <div key={inv.id}>
                                <div className="flex items-center justify-between px-5 py-3 hover:bg-white/5 cursor-pointer" onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${inv.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'gradient-bg text-white'}`}>
                                            {inv.status === 'completed' ? '✓' : inv.round_type[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{inv.candidate_email || 'Open Invite'}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(inv.status)}`}>{inv.status}</span>
                                                <span className="text-xs text-slate-600">{inv.round_type} · {inv.difficulty}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {inv.final_score && <span className="text-sm font-black text-white">{inv.final_score}%</span>}
                                        <span className="text-xs text-slate-600">{fmt(inv.created_at)}</span>
                                        {expanded === inv.id ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                    </div>
                                </div>
                                {expanded === inv.id && (
                                    <div className="px-5 py-3 flex gap-2 flex-wrap" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <button onClick={() => copyLink(inv.invite_code)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-all">
                                            <Copy className="w-3.5 h-3.5" /> Copy Link
                                        </button>
                                        {inv.status === 'completed' && (
                                            <button onClick={() => setReportInvite(inv)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all">
                                                <Eye className="w-3.5 h-3.5" /> View Report
                                            </button>
                                        )}
                                        <span className="flex items-center gap-1 text-xs text-slate-600 ml-auto">
                                            <Link2 className="w-3 h-3" /> {inv.invite_code}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
