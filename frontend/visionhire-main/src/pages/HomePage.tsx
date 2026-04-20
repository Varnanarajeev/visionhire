import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, BarChart3, Upload, Clock } from 'lucide-react';
import { auth } from '../lib/auth';
import { v4 as uuidv4 } from 'uuid';

interface SessionRecord { date: string; score: number; verdict: string; }

export default function HomePage() {
    const navigate = useNavigate();
    const email = auth.getUserEmail() || 'Candidate';
    const name = email.split('@')[0];
    const [history, setHistory] = useState<SessionRecord[]>([]);

    const role = localStorage.getItem('userRole');

    useEffect(() => {
        if (role !== 'recruiter' && role !== 'admin') {
            const raw = localStorage.getItem('interviewHistory');
            if (raw) {
                try { setHistory(JSON.parse(raw)); } catch { setHistory([]); }
            }
        }
    }, [role]);

    const startNewInterview = () => {
        const sessionId = uuidv4();
        localStorage.setItem('interviewId', sessionId);
        navigate('/upload');
    };

    if (role === 'recruiter' || role === 'admin') {
        return (
            <div className="p-6 md:p-10 max-w-5xl mx-auto animate-fade-in-up">
                {/* Greeting */}
                <div className="mb-10 animate-fade-in-up">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-1">Welcome back</p>
                    <h1 className="text-4xl font-black text-white capitalize">{name} 👋</h1>
                    <p className="text-slate-400 mt-2">Ready to find top talent with VisionHire?</p>
                </div>

                {/* Start Interview CTA */}
                <div className="glass-card p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 animate-fade-in-up" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <div>
                        <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center mb-4 glow-indigo">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Schedule an Interview</h2>
                        <p className="text-slate-400 max-w-md">Create custom AI interview links tailored to your specific Job Descriptions and requirements.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={() => navigate('/recruiter/create')} className="btn-primary flex-shrink-0 text-base px-6">
                            Create Invite <ArrowRight className="w-5 h-5 ml-1" />
                        </button>
                        <button onClick={() => navigate('/recruiter')} className="btn-secondary flex-shrink-0 text-base px-6">
                            View Dashboard
                        </button>
                    </div>
                </div>

                {/* How it works for recruiters */}
                <div className="animate-fade-in-up">
                    <h2 className="text-lg font-bold text-white mb-5">How It Works</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { step: '01', title: 'Determine the Scope', desc: 'Input your job description, select the difficulty, and set custom rules for the AI.' },
                            { step: '02', title: 'Share the Link', desc: 'Send the unique tracking link to your candidate. They can take the interview at any time.' },
                            { step: '03', title: 'Review the Report', desc: 'Get a comprehensive transcript, multi-dimensional scoring, and brutal feedback.' },
                        ].map((s) => (
                            <div key={s.step} className="glass-card p-5 hover-glow transition-all">
                                <span className="text-xs font-black text-indigo-400">{s.step}</span>
                                <h3 className="text-white font-bold mt-2 mb-1">{s.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const totalInterviews = history.length;
    const bestScore = history.length ? Math.max(...history.map(s => s.score)) : null;
    const lastSession = history.length ? history[0].date : 'Never';

    const stats = [
        { icon: <Upload className="w-5 h-5 text-indigo-400" />, label: 'Interviews Taken', value: totalInterviews.toString() },
        { icon: <BarChart3 className="w-5 h-5 text-emerald-400" />, label: 'Best Score', value: bestScore !== null ? `${bestScore}%` : '—' },
        { icon: <Clock className="w-5 h-5 text-amber-400" />, label: 'Last Session', value: lastSession },
    ];


    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Greeting */}
            <div className="mb-10 animate-fade-in-up">
                <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-1">Welcome back</p>
                <h1 className="text-4xl font-black text-white capitalize">{name} 👋</h1>
                <p className="text-slate-400 mt-2">Ready to sharpen your interview skills?</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 animate-fade-in-up stagger-children">
                {stats.map((s) => (
                    <div key={s.label} className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">{s.icon}<span className="text-xs text-slate-500 font-medium uppercase tracking-widest">{s.label}</span></div>
                        <p className="text-3xl font-black text-white">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Start Interview CTA */}
            <div className="glass-card p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 animate-fade-in-up" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.25)' }}>
                <div>
                    <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center mb-4 glow-indigo">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Start a New Interview</h2>
                    <p className="text-slate-400 max-w-md">Upload your resume and practice with our AI interviewer. Get detailed feedback and scores in minutes.</p>
                </div>
                <button onClick={startNewInterview} className="btn-primary flex-shrink-0 text-base px-8">
                    Begin <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            {/* How it works */}
            <div className="animate-fade-in-up">
                <h2 className="text-lg font-bold text-white mb-5">How It Works</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { step: '01', title: 'Upload Resume', desc: 'We parse your resume to personalize each question to your experience.' },
                        { step: '02', title: 'Answer Questions', desc: 'Speak or type your answers to 3 targeted technical and behavioral questions.' },
                        { step: '03', title: 'Get Report', desc: 'Receive a detailed AI report with scores, strengths, and areas to improve.' },
                    ].map((s) => (
                        <div key={s.step} className="glass-card p-5">
                            <span className="text-xs font-black gradient-text">{s.step}</span>
                            <h3 className="text-white font-bold mt-2 mb-1">{s.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
