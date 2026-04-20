import { Zap, Mic, BarChart3, Shield, Brain, Cpu } from 'lucide-react';

const features = [
    { icon: <Brain className="w-6 h-6 text-indigo-400" />, title: 'Resume-Aware AI', desc: 'Every question is generated based on your actual resume — no generic filler.' },
    { icon: <Mic className="w-6 h-6 text-purple-400" />, title: 'Speech Recognition', desc: 'Answer naturally via voice. Powered by OpenAI Whisper for accurate transcription.' },
    { icon: <BarChart3 className="w-6 h-6 text-emerald-400" />, title: 'Strict Scoring', desc: 'Our AI evaluates like a real interviewer — honest feedback, no sugar-coating.' },
    { icon: <Shield className="w-6 h-6 text-amber-400" />, title: 'Privacy First', desc: 'All data stays local. No third-party tracking. Your sessions are yours only.' },
    { icon: <Cpu className="w-6 h-6 text-rose-400" />, title: 'Powered by Groq', desc: 'Ultra-fast LLM inference via Groq for near real-time question generation.' },
    { icon: <Zap className="w-6 h-6 text-cyan-400" />, title: 'Instant Reports', desc: 'Detailed evaluation reports generated seconds after your interview ends.' },
];


export default function AboutPage() {
    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
            {/* Hero */}
            <div className="mb-12 animate-fade-in-up">
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-6 glow-indigo">
                    <Zap className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4">About VisionHire</h1>
                <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                    VisionHire is an AI-powered interview coaching platform that simulates real technical interviews.
                    Upload your resume, answer 3 targeted questions, and receive an honest, data-driven evaluation report — all in under 5 minutes.
                </p>
            </div>

            {/* Mission */}
            <div className="glass-card p-8 mb-10 animate-fade-in-up" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
                <h2 className="text-xl font-black text-white mb-3">Our Mission</h2>
                <p className="text-slate-400 leading-relaxed">
                    Most candidates fail interviews not because they lack skill — but because they've never practiced in a realistic environment.
                    VisionHire bridges that gap by providing immediate, honest, AI-driven feedback that real interviewers would give.
                </p>
            </div>

            {/* Features */}
            <div className="mb-12 animate-fade-in-up">
                <h2 className="text-xl font-black text-white mb-6">Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map(f => (
                        <div key={f.title} className="glass-card p-5">
                            <div className="mb-3">{f.icon}</div>
                            <h3 className="font-bold text-white mb-1">{f.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
