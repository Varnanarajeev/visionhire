import { useState } from 'react';
import { Zap, Upload, Mic, FileText, ArrowRight, X } from 'lucide-react';

const STEPS = [
    {
        icon: <Zap className="w-8 h-8 text-indigo-400" />,
        title: 'Welcome to VisionHire! 🎉',
        description: 'Your AI-powered interview practice platform. Let\'s take a quick tour to get you started.',
    },
    {
        icon: <Upload className="w-8 h-8 text-blue-400" />,
        title: 'Upload Your Resume',
        description: 'Start by uploading your PDF resume. You can optionally paste a job description to get tailored questions.',
    },
    {
        icon: <Mic className="w-8 h-8 text-emerald-400" />,
        title: 'Answer Questions',
        description: 'Our AI interviewer Alex will ask you technical, HR, or behavioral questions. Speak or type your answers.',
    },
    {
        icon: <FileText className="w-8 h-8 text-purple-400" />,
        title: 'Get Your Report',
        description: 'Receive a detailed analysis with scores, JD match, skill recommendations, and tips to improve. Good luck! 🚀',
    },
];

interface OnboardingTourProps {
    onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [step, setStep] = useState(0);
    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="relative w-full max-w-md mx-4 animate-fade-in-up">
                {/* Close button */}
                <button onClick={onComplete}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <X className="w-4 h-4" />
                </button>

                <div className="glass-card p-8 text-center" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mb-6">
                        {STEPS.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-indigo-500' : i < step ? 'w-4 bg-indigo-400/50' : 'w-4 bg-white/10'
                                }`} />
                        ))}
                    </div>

                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        {current.icon}
                    </div>

                    {/* Content */}
                    <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">{current.description}</p>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3">
                        {step > 0 ? (
                            <button onClick={() => setStep(s => s - 1)}
                                className="btn-ghost text-sm py-2.5 px-5">
                                Back
                            </button>
                        ) : (
                            <button onClick={onComplete}
                                className="btn-ghost text-sm py-2.5 px-5">
                                Skip Tour
                            </button>
                        )}
                        <button onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
                            className="btn-primary text-sm py-2.5 px-6">
                            {isLast ? 'Get Started' : 'Next'} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Step counter */}
                    <p className="text-xs text-slate-600 mt-5">{step + 1} of {STEPS.length}</p>
                </div>
            </div>
        </div>
    );
}
