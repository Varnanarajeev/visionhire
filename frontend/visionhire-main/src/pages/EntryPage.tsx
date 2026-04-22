import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, UserPlus, LogIn, Zap, Star, CheckCircle2,
  Mic, FileText, BarChart3, Brain, Timer, Link2,
  Video, MessageSquare, TrendingUp, Shield,
} from 'lucide-react';

/* ── scroll-reveal hook ──────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, vis };
}
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, vis } = useReveal();
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(40px)', transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

/* ── inline CSS UI Mockup ──────────────────────────────────────────── */
function UIMockup() {
  return (
    <div className="w-full rounded-2xl overflow-hidden relative" style={{ background: '#0d1224', border: '1px solid rgba(99,102,241,0.2)', aspectRatio: '16/8' }}>
      {/* top bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-amber-500/70" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <div className="flex-1 mx-4 h-5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>

      {/* content area */}
      <div className="flex h-full" style={{ background: '#070d1a' }}>
        {/* left: video + recording */}
        <div className="w-1/3 p-4 flex flex-col gap-3 border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {/* camera box */}
          <div className="flex-1 rounded-xl flex flex-col items-center justify-center gap-2 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#1a1e3a,#12172e)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-[9px] font-bold">LIVE</span>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-slate-500">You</span>
          </div>
          {/* mic bar */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Mic className="w-3 h-3 text-indigo-400" />
            <div className="flex-1 flex gap-0.5 items-end h-4">
              {[4, 7, 3, 9, 5, 8, 4, 6, 3, 7].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-indigo-500 opacity-70" style={{ height: `${h * 10}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* middle: question panel */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-white text-[10px] font-bold leading-none">AI INTERVIEWER</p>
              <p className="text-slate-600 text-[9px]">Alex • VisionHire</p>
            </div>
          </div>
          <div className="rounded-xl p-3 flex-1" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
            <p className="text-slate-300 text-xs leading-relaxed">
              Can you walk me through a challenging technical problem you solved recently, and explain your approach to debugging it?
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-7 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <div className="px-3 h-7 rounded-lg flex items-center justify-center gradient-bg">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>

        {/* right: scores */}
        <div className="w-1/4 p-3 flex flex-col gap-2 border-l" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Scores</p>
          {[
            { label: 'Communication', val: 88, color: '#818cf8' },
            { label: 'Confidence', val: 74, color: '#34d399' },
            { label: 'Technical', val: 91, color: '#60a5fa' },
          ].map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-slate-500">{s.label}</span>
                <span className="text-[9px] font-bold" style={{ color: s.color }}>{s.val}%</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full" style={{ width: `${s.val}%`, background: s.color, opacity: 0.8 }} />
              </div>
            </div>
          ))}
          <div className="mt-2 rounded-xl p-2 text-center" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p className="text-[8px] text-slate-500 uppercase mb-0.5">Q2 of 5</p>
            <p className="text-white font-black text-base">84<span className="text-xs">%</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

const testimonials = [
  { name: 'Arjun Sharma', role: 'Software Engineer @ Google', avatar: 'AS', stars: 5, text: 'VisionHire gave me brutally honest feedback that no mock interview had before. I cleared my FAANG interview on the next attempt after just 3 sessions.' },
  { name: 'Priya Nair', role: 'Data Analyst @ Infosys', avatar: 'PN', stars: 5, text: 'The AI actually reads your resume and asks questions about YOUR experience. It felt so real, I was nervous even though I knew it was AI.' },
  { name: 'Rohan Mehta', role: 'Product Manager @ Flipkart', avatar: 'RM', stars: 5, text: 'The report it generates is gold. Specific skill gaps, recommended resources, even communication scores. No human coach gives you this level of detail.' },
  { name: 'Sneha Kulkarni', role: 'Frontend Dev @ Razorpay', avatar: 'SK', stars: 5, text: 'I used it 5 times before my dream job interview. Each session got harder as the AI learned what I needed to work on. Game changing.' },
  { name: 'Kiran Reddy', role: 'ML Engineer @ Swiggy', avatar: 'KR', stars: 5, text: 'Recruiters on our team now send VisionHire links instead of phone screens. The AI report matches our hiring decisions 90% of the time.' },
  { name: 'Divya Pillai', role: 'HR Manager @ TCS', avatar: 'DP', stars: 5, text: 'As a recruiter, I can now screen 10x more candidates. The AI shortlist verdict is incredibly accurate. This is the future of hiring.' },
];

const features = [
  { icon: Mic, title: 'Voice + Text Input', desc: 'Answer by speaking naturally or typing. The AI understands both fluently.', color: '#818cf8' },
  { icon: FileText, title: 'Resume-Aware AI', desc: 'Upload your resume once. Every question is tailored to your exact experience.', color: '#34d399' },
  { icon: BarChart3, title: '6-Dimension Scoring', desc: 'Communication, Technical, Professionalism, Energy, Confidence, and more.', color: '#60a5fa' },
  { icon: Brain, title: 'Adaptive Questions', desc: 'The AI follows up based on your answer — just like a real interviewer.', color: '#f472b6' },
  { icon: Timer, title: 'Timed Sessions', desc: 'Practice under pressure with 1 to 15 minute timed interview modes.', color: '#fb923c' },
  { icon: Link2, title: 'Recruiter Mode', desc: 'Send invite links to candidates and receive auto-generated evaluation reports.', color: '#a78bfa' },
];

export default function EntryPage() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      document.querySelectorAll<HTMLElement>('.parallax-orb').forEach((orb, i) => {
        const f = (i + 1) * 14;
        orb.style.transform = `translate(${(e.clientX - window.innerWidth / 2) / f}px,${(e.clientY - window.innerHeight / 2) / f}px)`;
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#050810' }}>

      {/* ── PARTICLES ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full"
            style={{ background: 'rgba(139,92,246,0.45)', top: `${(i * 37 + 11) % 100}%`, left: `${(i * 53 + 7) % 100}%`, animation: `particleFloat ${4 + (i % 5)}s ease-in-out infinite`, animationDelay: `${(i * 0.4) % 6}s` }} />
        ))}
      </div>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="relative min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse 90% 70% at 50% -5%,rgba(99,102,241,0.22) 0%,transparent 65%)' }}>
        <div className="parallax-orb absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full pointer-events-none transition-transform duration-200"
          style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.28) 0%,transparent 70%)' }} />
        <div className="parallax-orb absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none transition-transform duration-200"
          style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.22) 0%,transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* NAV */}
        <nav className="relative z-20 flex items-center justify-between px-6 md:px-14 py-6"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(-20px)', transition: 'all 0.6s ease' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center glow-indigo"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-black text-white tracking-wide">VisionHire</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button onClick={() => navigate('/register')} className="btn-primary text-sm py-2 px-5">
              <UserPlus className="w-4 h-4" /> Get Started
            </button>
          </div>
        </nav>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-8 pb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.1s' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI-Powered Interview Evaluation
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black leading-[1.04] mb-6"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(30px)', transition: 'all 0.8s ease 0.2s' }}>
            <span className="text-white">Your AI</span><br />
            <span style={{ background: 'linear-gradient(130deg,#818cf8 30%,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Interview Coach</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-xl leading-relaxed mb-10"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.8s ease 0.35s' }}>
            Practice with an AI that <span className="text-white font-semibold">watches, listens, and evaluates</span> you in real-time. Get a detailed performance report in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease 0.5s' }}>
            <button onClick={() => navigate('/register')} className="group btn-primary text-base px-8 py-3.5 gap-2 relative overflow-hidden"
              style={{ boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(99,102,241,0.3))' }} />
              <UserPlus className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Start for Free</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/login')} className="btn-ghost text-base px-8 py-3.5 gap-2">
              <LogIn className="w-5 h-5" /> Sign In
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-3"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease 0.7s' }}>
            {[{ val: '3 min', label: 'Avg Interview' }, { val: 'AI', label: 'Powered Analysis' }, { val: '100%', label: 'Private & Secure' }].map(s => (
              <div key={s.val} className="px-5 py-3 rounded-2xl text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
                <p className="text-white font-black text-lg leading-none">{s.val}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRODUCT MOCKUP ────────────────────────────────────────── */}
      <div className="relative z-10 px-6 md:px-14 py-8 max-w-5xl mx-auto">
        <Reveal>
          <div className="relative" style={{ boxShadow: '0 0 100px rgba(99,102,241,0.2), 0 60px 100px rgba(0,0,0,0.6)' }}>
            <UIMockup />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl"
              style={{ background: 'rgba(10,15,30,0.9)', border: '1px solid rgba(99,102,241,0.3)', backdropFilter: 'blur(20px)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-white font-semibold">Live AI Interview Session</span>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <div className="relative z-10 px-6 md:px-14 py-24 max-w-5xl mx-auto">
        <Reveal>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest text-center mb-3">Process</p>
          <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-16">How it works</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: FileText, title: 'Upload Resume', desc: 'Drag and drop your PDF. Our AI reads every line and prepares custom questions about YOUR experience.', color: '#818cf8' },
            { step: '02', icon: Mic, title: 'Attend Interview', desc: 'The AI interviewer asks questions in real-time. Speak naturally or type your answers.', color: '#34d399' },
            { step: '03', icon: TrendingUp, title: 'Get Your Report', desc: 'Receive scores across 6 dimensions, a skill gap analysis, and personalized learning resources.', color: '#60a5fa' },
          ].map((s, i) => (
            <Reveal key={s.step} delay={i * 0.15}>
              <div className="glass-card p-6 text-center hover-glow transition-all h-full">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
                  <s.icon className="w-6 h-6" style={{ color: s.color }} />
                </div>
                <span className="text-xs font-black tracking-widest"
                  style={{ background: `linear-gradient(135deg,${s.color},#60a5fa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  STEP {s.step}
                </span>
                <h3 className="text-white font-black text-lg mt-2 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── FEATURES GRID ─────────────────────────────────────────── */}
      <div className="relative z-10 px-6 md:px-14 py-20" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest text-center mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-4">Everything you need</h2>
            <p className="text-slate-500 text-center mb-14 max-w-md mx-auto">One platform to practice, get evaluated, and land your dream job.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="glass-card p-5 hover-glow transition-all h-full group">
                  <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: `${f.color}18`, border: `1px solid ${f.color}28` }}>
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-white font-bold mb-1">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <div className="relative z-10 px-6 md:px-14 py-20 max-w-6xl mx-auto">
        <Reveal>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest text-center mb-3">Testimonials</p>
          <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-4">Loved by candidates<br />&amp; recruiters</h2>
          <p className="text-slate-500 text-center mb-14 max-w-lg mx-auto">From freshers to senior engineers — VisionHire has helped thousands nail their interviews.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.07}>
              <div className="glass-card p-5 hover-glow transition-all h-full flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[...Array(t.stars)].map((_, si) => <Star key={si} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-xs font-black text-white flex-shrink-0">{t.avatar}</div>
                  <div>
                    <p className="text-white text-sm font-bold leading-none">{t.name}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── CTA BANNER ────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 md:px-14 py-20 max-w-4xl mx-auto">
        <Reveal>
          <div className="relative rounded-3xl overflow-hidden p-10 text-center"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 0 60px rgba(99,102,241,0.15)' }}>
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.3) 0%,transparent 70%)' }} />
            <Shield className="w-10 h-10 text-indigo-400 mx-auto mb-4 opacity-60" />
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 relative z-10">Ready to ace your<br />next interview?</h2>
            <p className="text-slate-400 mb-8 relative z-10 max-w-md mx-auto">Join thousands of candidates who've landed their dream jobs with VisionHire.</p>
            <button onClick={() => navigate('/register')} className="btn-primary text-base px-10 py-3.5 gap-2 relative z-10"
              style={{ boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}>
              <UserPlus className="w-5 h-5" /> Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center gap-6 mt-8 relative z-10">
              {['No credit card', 'Free forever', 'Instant results'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 text-center py-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg gradient-bg flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div>
          <span className="text-sm font-bold text-white">VisionHire</span>
        </div>
        <p className="text-slate-600 text-xs">© 2026 VisionHire. AI-powered interview coaching.</p>
      </footer>

      <style>{`
        @keyframes particleFloat {
          0%,100% { transform:translateY(0) scale(1); opacity:0.3; }
          50%      { transform:translateY(-20px) scale(1.5); opacity:0.65; }
        }
      `}</style>
    </div>
  );
}
