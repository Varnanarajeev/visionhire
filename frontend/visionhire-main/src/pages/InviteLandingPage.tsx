import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Briefcase, Clock, Target, Zap, Upload, Loader2, FileText, AlertCircle } from 'lucide-react';
import { auth } from '../lib/auth';

const API = 'http://localhost:8000';

interface InviteInfo {
    invite_code: string; round_type: string; duration_secs: number;
    difficulty: string; focus_areas: string; has_jd: boolean; status: string;
}

export default function InviteLandingPage() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [invite, setInvite] = useState<InviteInfo | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (!code) return;
        fetch(`${API}/recruiter/invite/${code}`)
            .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
            .then(d => { setInvite(d); setLoading(false); })
            .catch(e => { setError(e.message || 'Invite not found'); setLoading(false); });
    }, [code]);

    const startInterview = async () => {
        if (!file || !code) return;

        // Check if user is logged in
        if (!auth.isAuthenticated()) {
            localStorage.setItem('pendingInvite', code);
            navigate('/login');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API}/invite/${code}/upload`, {
                method: 'POST', body: formData,
                headers: { Authorization: `Bearer ${auth.getToken()}` },
            });
            const data = await res.json();
            if (data.error) { setError(data.error); setUploading(false); return; }

            // Store session config and navigate to interview
            localStorage.setItem('interviewId', data.session_id);
            localStorage.setItem('interviewDuration', String(data.duration_secs));
            localStorage.setItem('roundType', data.round_type);
            navigate('/interview');
        } catch {
            setError('Failed to upload resume');
        }
        finally { setUploading(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
                <div className="glass-card p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-xl font-black text-white mb-2">{error === 'Not found' ? 'Invite Not Found' : 'Error'}</h1>
                    <p className="text-slate-500 text-sm mb-4">{error || 'This invite link is invalid or has expired.'}</p>
                    <button onClick={() => navigate('/')} className="btn-ghost text-xs">Go Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
            <div className="glass-card p-8 max-w-lg w-full animate-fade-in-up">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center gradient-bg">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">VisionHire Interview</h1>
                        <p className="text-slate-500 text-xs">You have been invited to an AI-powered interview</p>
                    </div>
                </div>

                {/* Interview Details */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Briefcase className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-slate-500">Round Type</p>
                            <p className="text-sm font-semibold text-white capitalize">{invite.round_type}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-slate-500">Duration</p>
                            <p className="text-sm font-semibold text-white">{invite.duration_secs / 60} minutes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <Target className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-slate-500">Difficulty Level</p>
                            <p className="text-sm font-semibold text-white capitalize">{invite.difficulty}</p>
                        </div>
                    </div>
                    {invite.focus_areas && (
                        <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Zap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs text-slate-500">Focus Areas</p>
                                <p className="text-sm font-semibold text-white">{invite.focus_areas}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Upload Resume */}
                <div className="mb-4">
                    <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block">Upload Your Resume (PDF)</label>
                    <label className="flex items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all hover:border-indigo-500/40" style={{ background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)' }}>
                        <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                        {file ? (
                            <><FileText className="w-5 h-5 text-emerald-400" /><span className="text-sm text-white font-semibold">{file.name}</span></>
                        ) : (
                            <><Upload className="w-5 h-5 text-slate-500" /><span className="text-sm text-slate-500">Click to select PDF</span></>
                        )}
                    </label>
                </div>

                <button onClick={startInterview} disabled={!file || uploading} className="btn-primary w-full py-3 text-sm gap-2">
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Start Interview'}
                </button>

                <p className="text-xs text-slate-600 text-center mt-4">Powered by VisionHire AI</p>
            </div>
        </div>
    );
}
