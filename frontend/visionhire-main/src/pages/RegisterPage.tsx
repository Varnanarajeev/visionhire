import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/auth';
import { Loader2, Lock, Mail, User, ArrowRight, Zap, Briefcase, GraduationCap } from 'lucide-react';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await auth.register(email, password, fullName, role);
            await auth.login(email, password);
            // Clear any previous user's data so new user starts fresh
            localStorage.removeItem('interviewHistory');
            localStorage.removeItem('finalReport');
            localStorage.removeItem('lastLoggedReport');
            navigate(role === 'recruiter' ? '/recruiter' : '/upload');
        } catch (err: any) {
            if (err?.response?.status === 400) {
                setError('Email already registered. Try signing in instead.');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#0a0f1e' }}>

            {/* Blobs */}
            <div className="blob w-72 h-72 top-0 right-0" style={{ background: '#8b5cf6' }} />
            <div className="blob w-56 h-56 bottom-0 left-0" style={{ background: '#6366f1', animationDelay: '3s' }} />

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">VisionHire</span>
                    </Link>
                    <h1 className="text-3xl font-black text-white mb-2">Create your account</h1>
                    <p className="text-slate-500">Free forever. No credit card required.</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8 glow-purple">

                    {error && (
                        <div className="mb-6 p-4 rounded-xl text-sm text-red-300 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Role Toggle */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">I am a</label>
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <button type="button" onClick={() => setRole('candidate')}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === 'candidate' ? 'gradient-bg text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                                <GraduationCap className="w-4 h-4" /> Candidate
                            </button>
                            <button type="button" onClick={() => setRole('recruiter')}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === 'recruiter' ? 'gradient-bg text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                                <Briefcase className="w-4 h-4" /> Recruiter
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                <input
                                    type="text" required value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="input-dark" placeholder="Jane Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                <input
                                    type="email" required value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-dark" placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                                <input
                                    type="password" required minLength={6} value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-dark" placeholder="Min. 6 characters"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
