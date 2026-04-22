import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, BarChart3, Upload, Clock, Sparkles, TrendingUp, Star, Link2, Users, CheckCircle2, AlertCircle, Plus, LayoutDashboard } from 'lucide-react';
import { auth } from '../lib/auth';
import { v4 as uuidv4 } from 'uuid';

interface SessionRecord { date: string; score: number; verdict: string; }
interface RecruiterStats { total_invites: number; completed: number; pending: number; avg_score: number | null; }

const API = 'http://localhost:8000';

const candidateTips = [
    "Structure your answers using STAR method: Situation, Task, Action, Result.",
    "Research the company's tech stack before a technical interview.",
    "Pause for 2-3 seconds before answering — it shows you're thoughtful.",
    "Quantify your achievements with numbers wherever possible.",
    "It's okay to say 'I don't know' — follow it with how you'd find out.",
    "Make eye contact with the camera, not the screen.",
];

const recruiterTips = [
    "Include a specific job description so the AI asks role-relevant questions.",
    "Set a 5–10 min duration for screening rounds to keep candidates focused.",
    "Use the 'Focus Areas' field to target specific skills you care about.",
    "Send the invite link at least 48 hours before your decision deadline.",
    "Review the transcript alongside the score for the full picture.",
    "Use the verdict label (Shortlisted/Rejected) to speed up your review queue.",
];

export default function HomePage() {
    const navigate = useNavigate();
    const email = auth.getUserEmail() || 'Candidate';
    const name = email.split('@')[0];
    const [history, setHistory] = useState<SessionRecord[]>([]);
    const [recruiterStats, setRecruiterStats] = useState<RecruiterStats | null>(null);
    const [tip] = useState(() => {
        const role = localStorage.getItem('userRole');
        const pool = role === 'recruiter' || role === 'admin' ? recruiterTips : candidateTips;
        return pool[Math.floor(Math.random() * pool.length)];
    });
    const [timeOfDay] = useState(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    });

    const role = localStorage.getItem('userRole');

    useEffect(() => {
        if (role !== 'recruiter' && role !== 'admin') {
            const raw = localStorage.getItem('interviewHistory');
            if (raw) { try { setHistory(JSON.parse(raw)); } catch { setHistory([]); } }
        }
        if (role === 'recruiter' || role === 'admin') {
            fetch(`${API}/recruiter/stats`, { headers: { Authorization: `Bearer ${auth.getToken()}` } })
                .then(r => r.json()).then(setRecruiterStats).catch(() => { });
        }
    }, [role]);

    const startNewInterview = () => {
        localStorage.setItem('interviewId', uuidv4());
        navigate('/upload');
    };

    // ── RECRUITER / ADMIN VIEW ──────────────────────────────────────────────────
    if (role === 'recruiter' || role === 'admin') {
        const s = recruiterStats;
        const stats = [
            { icon: Link2, label: 'Invites Sent', value: s ? s.total_invites.toString() : '—', bg: 'rgba(99,102,241,0.1)', color: '#818cf8' },
            { icon: CheckCircle2, label: 'Completed', value: s ? s.completed.toString() : '—', bg: 'rgba(16,185,129,0.1)', color: '#34d399' },
            { icon: AlertCircle, label: 'Pending', value: s ? s.pending.toString() : '—', bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
            { icon: BarChart3, label: 'Avg Score', value: s?.avg_score != null ? `${Math.round(s.avg_score)}%` : '—', bg: 'rgba(59,130,246,0.1)', color: '#60a5fa' },
        ];
        return (
            <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-fade-in-up">

                {/* Hero */}
                <div className="relative glass-card p-8 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))', border: '1px solid rgba(99,102,241,0.28)' }}>
                    <div className="blob w-56 h-56 -top-10 -right-10 opacity-20" style={{ background: '#6366f1' }} />
                    <div className="blob w-32 h-32 bottom-0 left-1/3 opacity-10" style={{ background: '#8b5cf6', animationDelay: '2s' }} />
                    <div className="relative z-10">
                        <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">{timeOfDay} 👋</p>
                        <h1 className="text-4xl md:text-5xl font-black text-white capitalize mb-3">{name}</h1>
                        <p className="text-slate-400 mb-6 max-w-lg">
                            {s && s.pending > 0
                                ? `You have ${s.pending} pending interview${s.pending > 1 ? 's' : ''} waiting for review.`
                                : 'Ready to find your next top hire with VisionHire?'}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => navigate('/recruiter/create')} className="btn-primary gap-2 glow-indigo">
                                <Plus className="w-4 h-4" /> Create Interview Link <ArrowRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => navigate('/recruiter')} className="btn-ghost gap-2">
                                <LayoutDashboard className="w-4 h-4" /> View Dashboard
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
                    {stats.map(s => (
                        <div key={s.label} className="glass-card p-5 hover-glow transition-all" style={{ background: s.bg }}>
                            <div className="flex items-center gap-2 mb-2">
                                <s.icon className="w-5 h-5" style={{ color: s.color }} />
                                <span className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</span>
                            </div>
                            <p className="text-2xl font-black text-white truncate">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Quick actions + Recruiter tip */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tip */}
                    <div className="glass-card p-5 flex gap-4" style={{ border: '1px solid rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)' }}>
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                            <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Recruiter Tip</p>
                            <p className="text-sm text-slate-300 leading-relaxed">"{tip}"</p>
                        </div>
                    </div>
                    {/* Dashboard nudge */}
                    <div className="glass-card p-5 flex gap-4 cursor-pointer hover-glow transition-all" onClick={() => navigate('/recruiter')}
                        style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                            <Users className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Candidates</p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {s?.completed ? `${s.completed} interview${s.completed > 1 ? 's' : ''} completed. View all reports →` : 'No interviews completed yet. Send your first invite →'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div>
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">How It Works</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { step: '01', icon: Zap, title: 'Set the Scope', desc: 'Paste your JD, pick difficulty, and add custom AI instructions for the interview.', color: '#818cf8' },
                            { step: '02', icon: Link2, title: 'Share the Link', desc: 'Send the unique link to the candidate — they interview on their own time.', color: '#34d399' },
                            { step: '03', icon: TrendingUp, title: 'Review Report', desc: 'Get multi-dimensional AI scoring, strengths, and skill recommendations.', color: '#60a5fa' },
                        ].map(s => (
                            <div key={s.step} className="glass-card p-5 hover-glow transition-all group">
                                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center group-hover:scale-110 transition-transform"
                                    style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}>
                                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                                </div>
                                <span className="text-xs font-black tracking-widest" style={{ color: s.color }}>{s.step}</span>
                                <h3 className="text-white font-bold mt-1 mb-1">{s.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    // ── CANDIDATE VIEW ──────────────────────────────────────────────────────────
    const totalInterviews = history.length;
    const bestScore = history.length ? Math.max(...history.map(s => s.score)) : null;
    const avgScore = history.length ? Math.round(history.reduce((a, b) => a + b.score, 0) / history.length) : null;
    const lastSession = history.length ? history[0].date : null;
    const improving = history.length >= 2 && history[0].score > history[history.length - 1].score;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">

            {/* Hero Greeting Card */}
            <div className="relative glass-card p-8 overflow-hidden animate-fade-in-up"
                style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))', border: '1px solid rgba(99,102,241,0.28)' }}>
                <div className="blob w-56 h-56 -top-10 -right-10 opacity-20" style={{ background: '#6366f1' }} />
                <div className="blob w-32 h-32 bottom-0 left-1/3 opacity-10" style={{ background: '#8b5cf6', animationDelay: '2s' }} />
                <div className="relative z-10">
                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">{timeOfDay} 👋</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white capitalize mb-3">{name}</h1>
                    <p className="text-slate-400 mb-6 max-w-lg">
                        {totalInterviews > 0
                            ? improving ? `You're improving! Keep the momentum going.` : `You've completed ${totalInterviews} interview${totalInterviews > 1 ? 's' : ''}. Ready for another?`
                            : `Welcome to VisionHire! Let's ace your next interview together.`}
                    </p>
                    <button onClick={startNewInterview}
                        className="btn-primary text-base px-8 py-3 gap-2 glow-indigo">
                        <Zap className="w-5 h-5" />
                        {totalInterviews > 0 ? 'Start Another Interview' : 'Start My First Interview'}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up stagger-children">
                {[
                    { icon: <Upload className="w-5 h-5 text-indigo-400" />, label: 'Interviews', value: totalInterviews || '0', bg: 'rgba(99,102,241,0.1)' },
                    { icon: <Star className="w-5 h-5 text-amber-400" />, label: 'Best Score', value: bestScore !== null ? `${bestScore}%` : '—', bg: 'rgba(245,158,11,0.1)' },
                    { icon: <BarChart3 className="w-5 h-5 text-emerald-400" />, label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', bg: 'rgba(16,185,129,0.1)' },
                    { icon: <Clock className="w-5 h-5 text-blue-400" />, label: 'Last Session', value: lastSession || 'Never', bg: 'rgba(59,130,246,0.1)' },
                ].map(s => (
                    <div key={s.label} className="glass-card p-5 hover-glow transition-all" style={{ background: s.bg }}>
                        <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</span></div>
                        <p className="text-2xl font-black text-white truncate">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Tip of the Day + Progress Nudge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
                {/* Tip */}
                <div className="glass-card p-5 flex gap-4" style={{ border: '1px solid rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.04)' }}>
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                        <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Tip of the Day</p>
                        <p className="text-sm text-slate-300 leading-relaxed">"{tip}"</p>
                    </div>
                </div>

                {/* Progress nudge */}
                <div className="glass-card p-5 flex gap-4 cursor-pointer hover-glow transition-all" onClick={() => navigate('/progress')}
                    style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Your Progress</p>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {totalInterviews > 0 ? `${totalInterviews} session${totalInterviews > 1 ? 's' : ''} tracked. View your score history →` : 'Complete an interview to see your growth chart →'}
                        </p>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="animate-fade-in-up">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">How It Works</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { step: '01', icon: '📄', title: 'Upload Resume', desc: 'We parse your resume and personalize every question to your experience.' },
                        { step: '02', icon: '🎙️', title: 'Answer Questions', desc: 'Speak or type your answers to targeted technical and behavioral questions.' },
                        { step: '03', icon: '📊', title: 'Get Your Report', desc: 'Receive a full AI report with scores, strengths, and improvement areas.' },
                    ].map(s => (
                        <div key={s.step} className="glass-card p-5 hover-glow transition-all">
                            <div className="text-2xl mb-3">{s.icon}</div>
                            <span className="text-xs font-black gradient-text tracking-widest">{s.step}</span>
                            <h3 className="text-white font-bold mt-1 mb-1">{s.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
