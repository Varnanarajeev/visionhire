import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, BarChart3, UserPlus, LogIn } from 'lucide-react';

export default function EntryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6" style={{ background: '#0a0f1e' }}>

      {/* Animated blobs */}
      <div className="blob w-96 h-96 top-0 left-0" style={{ background: '#6366f1' }} />
      <div className="blob w-80 h-80 bottom-0 right-0" style={{ background: '#8b5cf6', animationDelay: '2s' }} />
      <div className="blob w-64 h-64 top-1/2 left-1/2" style={{ background: '#3b82f6', animationDelay: '4s' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-5xl w-full">

        {/* Logo */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center glow-indigo">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">VisionHire</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Your AI Interview
            <br />
            <span className="gradient-text">Coach & Evaluator</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Practice with an AI that <span className="text-white font-medium">watches, listens, and evaluates</span> you in real-time. Get detailed feedback instantly.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary text-base"
          >
            <UserPlus className="w-5 h-5" />
            Start for Free
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-ghost text-base"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {[
            { val: '3min', label: 'Avg Interview' },
            { val: 'AI', label: 'Powered Analysis' },
            { val: '100%', label: 'Private & Secure' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-black gradient-text mb-1">{s.val}</div>
              <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          {[
            { icon: <Zap className="w-4 h-4" />, label: 'Real-time Feedback' },
            { icon: <BarChart3 className="w-4 h-4" />, label: 'Detailed Report' },
            { icon: <Shield className="w-4 h-4" />, label: 'Secure & Private' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-full glass-card text-slate-300 text-sm">
              <span className="text-indigo-400">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
