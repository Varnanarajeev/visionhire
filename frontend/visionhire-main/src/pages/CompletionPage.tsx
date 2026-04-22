import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Loader2, Home, Download, Zap, RefreshCw,
  MapPin, Star, TrendingUp, Users, Clock, Calculator, Briefcase, CheckCircle2, XCircle, BookOpen, ExternalLink
} from 'lucide-react';

interface ReportData {
  candidate_name: string;
  resume_score: number;
  communication_score: number;
  professionalism_score: number;
  technical_score: number;
  energy_level: number;
  sociability: number;
  jd_match_score?: number | null;
  jd_analysis?: {
    matching_skills: string[];
    missing_skills: string[];
    fit_summary: string;
  };
  skill_recommendations?: { skill: string; resource_name: string; url: string; }[];
  skills_assessment: { interpersonal: number; analytical: number; time_management: number; mathematics: number; };
  star_ratings: { confidence: number; problem_solving: number; interpersonal: number; leadership: number; analytical: number; };
  key_strengths: string[];
  areas_for_improvement: string[];
  executive_summary: string;
  verdict: string;
}

const MOCK_REPORT: ReportData = {
  candidate_name: "Candidate", resume_score: 78, communication_score: 85,
  professionalism_score: 90, technical_score: 72, energy_level: 88, sociability: 82,
  skills_assessment: { interpersonal: 4.2, analytical: 3.8, time_management: 4.0, mathematics: 3.5 },
  star_ratings: { confidence: 4.5, problem_solving: 3.8, interpersonal: 4.2, leadership: 3.5, analytical: 4.0 },
  key_strengths: ["Strong verbal communication", "Good technical foundation", "High professionalism"],
  areas_for_improvement: ["Provide more concrete examples", "Deepen system design knowledge"],
  executive_summary: "The candidate showed strong potential with excellent communication skills and a solid technical foundation.",
  verdict: "Shortlisted"
};

export default function CompletionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [percentile, setPercentile] = useState<number | null>(null);




  const handleStartOver = () => {
    localStorage.removeItem('finalReport');
    localStorage.setItem('interviewId', uuidv4());
    navigate('/upload');
  };

  const exportReport = () => {
    if (!data) return;
    const lines = [
      '===== VisionHire Interview Report =====',
      `Candidate: ${data.candidate_name}`,
      `Verdict: ${data.verdict}`,
      '',
      `Overall Score: ${data.resume_score}/100`,
      `Communication: ${data.communication_score}/100`,
      `Technical: ${data.technical_score}/100`,
      `Professionalism: ${data.professionalism_score}/100`,
      '',
      'Key Strengths:',
      ...(data.key_strengths || []).map(s => `  - ${s}`),
      '',
      'Areas for Improvement:',
      ...(data.areas_for_improvement || []).map(s => `  - ${s}`),
      '',
      'Executive Summary:',
      data.executive_summary,
      '',
      `Generated on: ${new Date().toLocaleString()}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `VisionHire_Report_${data.candidate_name}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Log score to progress history
    const raw = localStorage.getItem('finalReport');
    let parsed: ReportData | null = null;
    if (raw && !localStorage.getItem('isInviteFlow')) {
      try {
        const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean);
        setData(parsed);
      } catch { parsed = MOCK_REPORT; setData(MOCK_REPORT); }
    } else {
      // Invite flow: no local report or explicit invite flow flag — show submitted message
      setLoading(false);
      localStorage.removeItem('isInviteFlow'); // clean up flag
      return;
    }
    setLoading(false);
    // Fetch percentile
    if (parsed) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:8000/interview/percentile?score=${parsed.resume_score}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).then(d => setPercentile(d.percentile)).catch(() => { });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a0f1e' }}>
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
        <p className="text-slate-500 font-medium">Generating your report...</p>
      </div>
    );
  }

  if (!data && !loading) {
    // Invite flow: no local report — attendee submitted, recruiter has the report
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6" style={{ background: '#0a0f1e' }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-3">Interview Complete!</h1>
          <p className="text-slate-400 text-base max-w-sm mx-auto">Your responses have been submitted successfully. The recruiter will review your AI-generated report shortly.</p>
        </div>
        <div className="glass-card p-5 text-center max-w-sm w-full">
          <p className="text-slate-500 text-sm">✅ Report generated and saved</p>
          <p className="text-slate-500 text-sm mt-1">✅ Recruiter has been notified</p>
          <p className="text-slate-500 text-sm mt-1">✅ You may now close this tab</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const safeVerdict = data.verdict || '';
  const isHired = safeVerdict.toLowerCase().includes('shortlist') || safeVerdict.toLowerCase().includes('hire');
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (circumference * (data.resume_score || 0)) / 100;

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#0a0f1e' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">VisionHire</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportReport} className="btn-ghost text-sm py-2 px-4">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handleStartOver} className="btn-ghost text-sm py-2 px-4">
            <RefreshCw className="w-4 h-4" /> Start Over
          </button>
          <button onClick={() => navigate('/home')} className="btn-primary text-sm py-2 px-4">
            <Home className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 stagger-children">

        {/* Candidate Header */}
        <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-2xl font-black text-white">
              {(data.candidate_name || 'C')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{data.candidate_name || 'Candidate'}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Remote</span>
              </div>
            </div>
          </div>
          <div className={`px-5 py-2 rounded-xl text-sm font-bold ${isHired ? 'text-emerald-400' : 'text-amber-400'}`}
            style={{ background: isHired ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border: isHired ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.25)' }}>
            {isHired ? '✓ ' : '○ '}{data.verdict}
          </div>
        </div>

        {/* Score Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Overall Score Ring */}
          <div className="glass-card p-6 flex flex-col items-center animate-fade-in-up">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Overall Score</p>
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90">
                <circle cx="72" cy="72" r="60" strokeWidth="10" fill="transparent" stroke="rgba(255,255,255,0.05)" />
                <circle cx="72" cy="72" r="60" strokeWidth="10" fill="transparent"
                  stroke="url(#scoreGradient)"
                  strokeDasharray={circumference} strokeDashoffset={offset}
                  strokeLinecap="round" className="transition-all duration-1000" />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{data.resume_score}</span>
                <span className="text-xs text-slate-500 font-medium">/ 100</span>
              </div>
            </div>
            {percentile !== null && (
              <p className="text-xs text-indigo-400 font-medium mt-3 text-center">
                📊 You scored better than {percentile}% of candidates
              </p>
            )}
          </div>

          {/* Workmap */}
          <div className="glass-card p-6 animate-fade-in-up">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Skills Map</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Users className="w-4 h-4 text-purple-400" />, label: 'Interpersonal', value: data.skills_assessment.interpersonal },
                { icon: <TrendingUp className="w-4 h-4 text-orange-400" />, label: 'Analytical', value: data.skills_assessment.analytical },
                { icon: <Clock className="w-4 h-4 text-pink-400" />, label: 'Time Mgmt', value: data.skills_assessment.time_management },
                { icon: <Calculator className="w-4 h-4 text-indigo-400" />, label: 'Math', value: data.skills_assessment.mathematics },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {s.icon}
                  <span className="text-xl font-black text-white mt-1">{s.value}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Evaluation */}
          <div className="glass-card p-6 animate-fade-in-up">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">AI Evaluation</p>
            <div className="space-y-4">
              {[
                { label: 'Professionalism', value: data.professionalism_score },
                { label: 'Communication', value: data.communication_score },
                { label: 'Energy Level', value: data.energy_level },
                { label: 'Sociability', value: data.sociability },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">{b.label}</span>
                    <span className="text-white font-bold">{b.value}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full progress-fill" style={{ width: `${b.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Star Ratings + Summary */}
          <div className="md:col-span-2 glass-card p-6 animate-fade-in-up">
            <h3 className="text-lg font-bold text-white mb-5">Detailed Feedback</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {Object.entries(data.star_ratings).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-slate-300 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-sm font-black text-white">{val}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(val) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="font-bold text-white mb-2">Executive Summary</h4>
              <p className="text-slate-400 leading-relaxed text-sm">{data.executive_summary}</p>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="glass-card p-6 space-y-6 animate-fade-in-up">
            <div>
              <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">✓ Key Strengths</h4>
              <ul className="space-y-2">
                {data.key_strengths.map((s, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 className="font-bold text-rose-400 mb-3">↑ To Improve</h4>
              <ul className="space-y-2">
                {data.areas_for_improvement.map((s, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-rose-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* JD Match Analysis (only if provided and matching) */}
        {(data.jd_match_score ?? 0) > 0 && data.jd_analysis && (
          <div className="glass-card p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-5">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Job Description Match</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* JD Score Circle */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">JD FIT Score</p>
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="56" cy="56" r="46" strokeWidth="8" fill="transparent" stroke="rgba(255,255,255,0.05)" />
                    <circle cx="56" cy="56" r="46" strokeWidth="8" fill="transparent"
                      stroke={(data.jd_match_score ?? 0) >= 70 ? '#10b981' : (data.jd_match_score ?? 0) >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeDasharray={2 * Math.PI * 46}
                      strokeDashoffset={2 * Math.PI * 46 - (2 * Math.PI * 46 * (data.jd_match_score ?? 0)) / 100}
                      strokeLinecap="round" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{data.jd_match_score}%</span>
                  </div>
                </div>
              </div>
              {/* Matching Skills */}
              <div>
                <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Skills Matched
                </h4>
                <ul className="space-y-1.5">
                  {data.jd_analysis.matching_skills.map((s, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">✓</span> {s}
                    </li>
                  ))}
                  {data.jd_analysis.matching_skills.length === 0 && (
                    <li className="text-sm text-slate-600">No matching skills identified</li>
                  )}
                </ul>
              </div>
              {/* Missing Skills */}
              <div>
                <h4 className="font-bold text-rose-400 mb-3 flex items-center gap-1.5 text-sm">
                  <XCircle className="w-4 h-4" /> Skills Missing
                </h4>
                <ul className="space-y-1.5">
                  {data.jd_analysis.missing_skills.map((s, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-rose-500 mt-0.5">✗</span> {s}
                    </li>
                  ))}
                  {data.jd_analysis.missing_skills.length === 0 && (
                    <li className="text-sm text-slate-600">No gaps identified</li>
                  )}
                </ul>
              </div>
            </div>
            {data.jd_analysis.fit_summary && (
              <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm text-slate-400 leading-relaxed">
                  <span className="text-white font-semibold">Fit Summary: </span>{data.jd_analysis.fit_summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Skill Gap Recommendations */}
        {data.skill_recommendations && data.skill_recommendations.length > 0 && (
          <div className="glass-card p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Recommended Resources</h3>
              <span className="text-xs text-slate-600 ml-auto">Based on skill gaps</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.skill_recommendations.map((rec, i) => (
                <a key={i} href={rec.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
                    <BookOpen className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{rec.skill}</p>
                    <p className="text-xs text-slate-500 truncate">{rec.resource_name}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
