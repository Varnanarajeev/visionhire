import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, Loader2, Zap, X, ArrowRight, Briefcase, Code, Users, MessageSquare } from 'lucide-react';
import { auth } from '../lib/auth';
import { v4 as uuidv4 } from 'uuid';


export default function ResumeUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [roundType, setRoundType] = useState('technical');
  const [durationMins, setDurationMins] = useState(3);
  const [customMins, setCustomMins] = useState('');
  const PRESETS = [1, 2, 3, 5, 10];
  const ROUNDS = [
    { id: 'technical', label: 'Technical', icon: <Code className="w-4 h-4" />, desc: 'Coding, system design, algorithms' },
    { id: 'hr', label: 'HR', icon: <Users className="w-4 h-4" />, desc: 'Behavioral, motivation, culture fit' },
    { id: 'behavioral', label: 'Behavioral', icon: <MessageSquare className="w-4 h-4" />, desc: 'STAR method, past experiences' },
  ];


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      f.type === 'application/pdf' ? (setFile(f), setError('')) : setError('Please upload a PDF file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      f.type === 'application/pdf' ? (setFile(f), setError('')) : setError('Please upload a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const interviewId = localStorage.getItem('interviewId') || (() => {
      const id = uuidv4();
      localStorage.setItem('interviewId', id);
      return id;
    })();

    setUploading(true); setError('');
    try {
      localStorage.setItem('interviewDuration', String((customMins ? parseInt(customMins) : durationMins) * 60));
      const formData = new FormData();

      formData.append('session_id', interviewId);
      formData.append('file', file);
      if (jobDescription.trim()) formData.append('job_description', jobDescription.trim());
      formData.append('round_type', roundType);
      const token = auth.getToken();

      const res = await fetch('http://localhost:8000/resume/upload', {
        method: 'POST', body: formData,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Upload failed'); }

      setUploading(false); setProcessing(true);
      setTimeout(() => { setProcessing(false); navigate('/interview'); }, 1500);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const steps = ['Upload Resume', 'Answer Questions', 'Get Report'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: '#0a0f1e' }}>
      {/* Blobs */}
      <div className="blob w-80 h-80 top-0 left-0" style={{ background: '#6366f1' }} />
      <div className="blob w-64 h-64 bottom-0 right-0" style={{ background: '#8b5cf6', animationDelay: '3s' }} />

      <div className="relative z-10 w-full max-w-2xl animate-fade-in-up">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">VisionHire</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-8">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i === 0 ? 'gradient-bg text-white' : 'text-slate-600'}`}
                  style={i !== 0 ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                  {i === 0 ? '1' : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === 0 ? 'text-white' : 'text-slate-600'}`}>{step}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />}
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Upload Your Resume</h1>
          <p className="text-slate-500">We'll analyze it to generate personalized interview questions</p>
        </div>

        {/* Upload Card */}
        <div className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm text-red-300 flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ {error}
            </div>
          )}

          {!file ? (
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag}
              onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl p-14 text-center cursor-pointer transition-all"
              style={{
                border: dragActive ? '2px dashed #6366f1' : '2px dashed rgba(255,255,255,0.1)',
                background: dragActive ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl gradient-bg flex items-center justify-center glow-indigo">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Drop your resume here</h3>
              <p className="text-slate-500 mb-1">or <span className="text-indigo-400 font-semibold">click to browse</span></p>
              <p className="text-xs text-slate-600 mt-3">PDF format only · Max 10MB</p>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Preview */}
              <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <FileText className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                </div>
                {!uploading && !processing && (
                  <button onClick={() => setFile(null)} className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {(uploading || processing) && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <p className="text-slate-300 font-medium">{uploading ? 'Uploading resume...' : 'AI is analyzing your resume...'}</p>
                  {processing && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle className="w-4 h-4" /> Extracting skills & generating questions
                    </div>
                  )}
                </div>
              )}

              {!uploading && !processing && (
                <>
                  {/* Job Description */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-slate-500 uppercase tracking-widest">Job Description</p>
                      <span className="text-xs text-slate-700">(optional)</span>
                    </div>
                    <textarea
                      value={jobDescription}
                      onChange={e => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here — interview questions and report analysis will be tailored to it..."
                      rows={4}
                      className="input-dark w-full text-sm resize-none"
                    />
                    {jobDescription.trim() && (
                      <p className="text-xs text-blue-400 mt-2">✓ JD will be used to tailor interview questions & resume analysis</p>
                    )}
                  </div>
                  {/* Round Type Selector */}
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">🎯 Interview Round</p>
                    <div className="grid grid-cols-3 gap-2">
                      {ROUNDS.map(r => (
                        <button key={r.id} onClick={() => setRoundType(r.id)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all border ${roundType === r.id
                              ? 'gradient-bg text-white border-transparent'
                              : 'text-slate-400 hover:text-white border-white/10 hover:border-white/20'
                            }`}>
                          {r.icon}
                          <span className="text-xs font-bold">{r.label}</span>
                          <span className="text-[10px] opacity-60 leading-tight">{r.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">⏱ Interview Duration</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {PRESETS.map(m => (
                        <button key={m} onClick={() => { setDurationMins(m); setCustomMins(''); }}
                          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${durationMins === m && !customMins
                            ? 'gradient-bg text-white border-transparent'
                            : 'text-slate-400 hover:text-white border-white/10 hover:border-white/20'
                            }`}>
                          {m} min
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={1} max={60} placeholder="Custom minutes"
                        value={customMins}
                        onChange={e => { setCustomMins(e.target.value); setDurationMins(0); }}
                        className="input-dark text-sm py-1.5 w-36"
                      />
                      <span className="text-slate-500 text-sm">minutes</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Selected: <span className="text-indigo-400 font-bold">{customMins || durationMins} min</span> interview
                    </p>
                  </div>
                  <button onClick={handleUpload} className="btn-primary w-full">
                    Continue to Interview <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
