import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface SessionRecord {
    date: string;
    score: number;
    verdict: string;
}

export default function ProgressPage() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionRecord[]>([]);

    useEffect(() => {
        // Load history from localStorage (we'll save each session result there)
        const raw = localStorage.getItem('interviewHistory');
        if (raw) {
            try { setSessions(JSON.parse(raw)); } catch { setSessions([]); }
        }

        // If the most recent report exists and isn't logged yet, log it
        const lastReport = localStorage.getItem('finalReport');
        const lastLogged = localStorage.getItem('lastLoggedReport');
        if (lastReport && lastReport !== lastLogged) {
            try {
                const clean = lastReport.replace(/```json/g, '').replace(/```/g, '').trim();
                const data = JSON.parse(clean);
                const newEntry: SessionRecord = {
                    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    score: data.resume_score || 0,
                    verdict: data.verdict || 'Unknown',
                };
                const current: SessionRecord[] = raw ? JSON.parse(raw) : [];
                const updated = [newEntry, ...current].slice(0, 10); // Keep last 10
                localStorage.setItem('interviewHistory', JSON.stringify(updated));
                localStorage.setItem('lastLoggedReport', lastReport);
                setSessions(updated);
            } catch { /* ignore */ }
        }
    }, []);

    const startNew = () => {
        localStorage.setItem('interviewId', uuidv4());
        navigate('/upload');
    };

    const maxScore = Math.max(...sessions.map(s => s.score), 1);
    const avgScore = sessions.length ? Math.round(sessions.reduce((a, b) => a + b.score, 0) / sessions.length) : 0;
    const bestScore = sessions.length ? Math.max(...sessions.map(s => s.score)) : 0;

    const verdictColor = (v: string) => {
        const l = v.toLowerCase();
        if (l.includes('strong') && l.includes('consider')) return 'text-emerald-400';
        if (l.includes('shortlist')) return 'text-blue-400';
        if (l.includes('reject')) return 'text-red-400';
        return 'text-amber-400';
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8 animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-black text-white">Progress</h1>
                    <p className="text-slate-500 mt-1">Track your improvement over time</p>
                </div>
                <button onClick={startNew} className="btn-primary text-sm">
                    New Interview <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {sessions.length === 0 ? (
                <div className="glass-card p-16 text-center animate-fade-in-up">
                    <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">No interviews yet</h2>
                    <p className="text-slate-500 mb-6">Complete your first interview to see your progress here.</p>
                    <button onClick={startNew} className="btn-primary">
                        <Zap className="w-4 h-4" /> Start First Interview
                    </button>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in-up stagger-children">
                        {[
                            { label: 'Avg Score', value: `${avgScore}%`, icon: <BarChart3 className="w-5 h-5 text-indigo-400" /> },
                            { label: 'Best Score', value: `${bestScore}%`, icon: <TrendingUp className="w-5 h-5 text-emerald-400" /> },
                            { label: 'Total Sessions', value: `${sessions.length}`, icon: <Zap className="w-5 h-5 text-amber-400" /> },
                        ].map(s => (
                            <div key={s.label} className="glass-card p-5">
                                <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</span></div>
                                <p className="text-3xl font-black text-white">{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Score Bar Chart */}
                    <div className="glass-card p-6 mb-6 animate-fade-in-up">
                        <h2 className="font-bold text-white mb-4">Score History</h2>
                        <div className="flex items-end gap-3 h-24">
                            {sessions.map((s, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                    <span className="text-xs text-white font-bold">{s.score}%</span>
                                    <div className="w-full rounded-t-lg progress-fill transition-all" style={{ height: `${(s.score / maxScore) * 64}px`, minHeight: 4 }} />
                                    <span className="text-xs text-slate-600 text-center leading-tight">{s.date.split(' ').slice(0, 2).join(' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sessions Table */}
                    <div className="glass-card overflow-hidden animate-fade-in-up">
                        <div className="p-6 pb-3">
                            <h2 className="font-bold text-white">All Sessions</h2>
                        </div>
                        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            {sessions.map((s, i) => (
                                <div key={i} className="flex items-center justify-between px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-slate-600 w-5">#{i + 1}</span>
                                        <div>
                                            <p className="text-sm font-medium text-white">{s.date}</p>
                                            <p className={`text-xs font-semibold ${verdictColor(s.verdict)}`}>{s.verdict}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                            <div className="h-full rounded-full progress-fill" style={{ width: `${s.score}%` }} />
                                        </div>
                                        <span className="text-white font-black text-sm w-10 text-right">{s.score}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
