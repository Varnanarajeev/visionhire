import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/auth';
import { Loader2, Lock, Mail, ArrowRight, Zap } from 'lucide-react';

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const previousEmail = localStorage.getItem('user_email');
            const data = await auth.login(email, password);
            // Only clear progress if a DIFFERENT user is logging in
            if (previousEmail && previousEmail !== email) {
                localStorage.removeItem('interviewHistory');
                localStorage.removeItem('finalReport');
                localStorage.removeItem('lastLoggedReport');
            }
            if (data.role === 'admin') {
                navigate('/admin');
            } else if (data.role === 'recruiter') {
                navigate('/recruiter');
            } else {
                navigate('/upload');
            }
        } catch {
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#0a0f1e' }}>

            {/* Blobs */}
            <div className="blob w-72 h-72 top-0 left-0" style={{ background: '#6366f1' }} />
            <div className="blob w-56 h-56 bottom-0 right-0" style={{ background: '#8b5cf6', animationDelay: '3s' }} />

            <div className="relative z-10 w-full max-w-md animate-fade-in-up">

                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">VisionHire</span>
                    </Link>
                    <h1 className="text-3xl font-black text-white mb-2">Welcome back</h1>
                    <p className="text-slate-500">Sign in to continue your journey</p>
                </div>

                {/* Card */}
                <div className="glass-card p-8 glow-indigo">

                    {error && (
                        <div className="mb-6 p-4 rounded-xl text-sm text-red-300 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
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
                                    type="password" required value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-dark" placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        No account?{' '}
                        <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
