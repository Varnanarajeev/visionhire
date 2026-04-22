import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Loader2, Zap, MessageSquare, Clock, LogOut } from 'lucide-react';


const API_URL = "http://localhost:8000";

export default function InterviewSessionPage() {
  const navigate = useNavigate();
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [useText, setUseText] = useState(false);
  const [sessionOver, setSessionOver] = useState(false); // kept for concludeInterview usage
  const [readyScreen, setReadyScreen] = useState(true);   // show pre-interview screen
  const [cameraReady, setCameraReady] = useState(false);  // camera granted
  const [cameraError, setCameraError] = useState(false);  // camera denied

  // Session countdown
  const durationSecs = parseInt(localStorage.getItem('interviewDuration') || '180');
  const [timeLeft, setTimeLeft] = useState(durationSecs);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const sessionOverRef = useRef(false);


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Request camera immediately on mount
    requestCamera();

    // CLEANUP: stop everything when user navigates away (back button, tab close, etc.)
    return () => {
      window.speechSynthesis.cancel();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Sync stream to video element — fires when loading ends (interview page mounts) OR readyScreen changes
  useEffect(() => {
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraReady, readyScreen, loading]);

  const requestCamera = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
    } catch {
      setCameraReady(false);
      setCameraError(true);
    }
  };

  const stopEverything = useCallback(() => {
    window.speechSynthesis.cancel();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    sessionOverRef.current = true;
  }, []);

  const handleQuit = () => {
    if (window.confirm('Are you sure you want to quit the interview? Your progress will be lost.')) {
      stopEverything();
      navigate('/home');
    }
  };

  const handleStartInterview = async () => {
    setReadyScreen(false);
    setLoading(true);
    await initSession();
  };

  const concludeInterview = (interviewId: string) => {
    if (sessionOverRef.current) return;
    sessionOverRef.current = true;
    const farewell = "Thank you for your time today. It was great speaking with you. We will now generate your performance report. Best of luck!";
    setCurrentQuestionText(farewell);
    speakText(farewell);
    setTimeout(() => {
      window.speechSynthesis.cancel();
      generateReport(interviewId);
    }, 6000);
  };

  // Start countdown once loading is false
  useEffect(() => {
    if (loading) return;
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          const interviewId = localStorage.getItem('interviewId') || 'test_session';
          concludeInterview(interviewId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [loading]);


  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const initSession = async () => {
    const interviewId = localStorage.getItem('interviewId') || "test_session";
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ session_id: interviewId })
      });
      // Await the first question so we don't show blank UI
      await processAnswer(null, null, true);
    } catch {
      setCurrentQuestionText("Could not connect to interview server. Please restart the backend.");
    } finally {
      setLoading(false);
    }
  };


  const startRecording = async () => {
    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { alert("Microphone access required. Please allow access."); return; }
    }
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
    mediaRecorder.onstop = () => processAnswer(new Blob(audioChunksRef.current, { type: 'audio/webm' }), null);
    mediaRecorder.start();
    setRecording(true); setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  };

  const processAnswer = async (audioBlob: Blob | null, text: string | null, isInit = false) => {
    const interviewId = localStorage.getItem('interviewId') || "test_session";
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('session_id', interviewId);
      if (audioBlob) formData.append('audio', audioBlob, 'answer.webm');
      else if (text) formData.append('text', text);
      else if (!isInit) return;

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/interview/process`, {
        method: 'POST', body: formData,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("API call failed");

      const data = await res.json();
      setCurrentQuestionText(data.text);
      setQuestionCount(data.question_count);
      speakText(data.text);

      // Handle API errors gracefully
      if (data.api_error) {
        console.warn("API error detected — Groq may be rate-limited or unavailable.");
        // Don't crash — just show the error message as the question text
      }

      // Only end if session_over AND we've asked at least 2 real questions (not init)
      if (data.session_over && data.question_count >= 2 && !sessionOverRef.current) {
        concludeInterview(interviewId);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false); setTextAnswer(''); setUseText(false); audioChunksRef.current = [];
    }
  };

  const generateReport = async (sessionId: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/interview/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await res.json();
    localStorage.setItem('finalReport', data.report);
    // Stop camera & mic before leaving so the laptop camera light turns off
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    navigate('/completion');
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.name.toLowerCase().includes('male')) || voices[0];
    if (v) utterance.voice = v;
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── Ready Screen ───────────────────────────────────────────────────────────
  if (readyScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6" style={{ background: '#0a0f1e' }}>
        <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-2">Ready for your Interview?</h1>
          <p className="text-slate-500 text-sm">Make sure your camera and microphone are working before you begin.</p>
        </div>

        {/* Camera Preview */}
        <div className="rounded-2xl overflow-hidden w-80 aspect-video relative" style={{ background: '#000' }}>
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          {!cameraReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
              {cameraError
                ? <><p className="text-red-400 text-sm font-semibold">Camera access denied</p>
                  <button onClick={requestCamera} className="btn-primary text-xs py-2 px-4">🔄 Retry Camera Access</button></>
                : <><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /><p className="text-slate-500 text-xs">Requesting camera...</p></>
              }
            </div>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center gap-6 text-sm">
          <span className={`flex items-center gap-2 ${cameraReady ? 'text-emerald-400' : 'text-amber-400'}`}>
            {cameraReady ? '✅' : '⏳'} Camera {cameraReady ? 'Ready' : 'Waiting'}
          </span>
          <span className={`flex items-center gap-2 ${cameraReady ? 'text-emerald-400' : 'text-amber-400'}`}>
            {cameraReady ? '✅' : '⏳'} Microphone {cameraReady ? 'Ready' : 'Waiting'}
          </span>
        </div>

        <button
          onClick={handleStartInterview}
          disabled={!cameraReady}
          className="btn-primary text-base py-3 px-10 gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Mic className="w-5 h-5" /> Start Interview
        </button>

        {!cameraReady && (
          <p className="text-slate-600 text-xs">Please allow camera & microphone access to begin.</p>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a0f1e' }}>
        <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center glow-indigo">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-slate-500">Preparing your interview...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: '#0a0f1e' }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">VisionHire</span>
        </div>
        <div className="flex items-center gap-3">
          {recording && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full recording-pulse" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400 text-xs font-bold">LIVE {formatTime(recordingTime)}</span>
            </div>
          )}
          {/* Countdown Clock */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${timeLeft < 60
            ? 'text-red-400'
            : 'text-slate-300'
            }`} style={{
              background: timeLeft < 60 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${timeLeft < 60 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`
            }}>
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Q{questionCount}
          </div>
          {/* Quit button */}
          <button
            onClick={handleQuit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all"
            style={{ border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <LogOut className="w-3.5 h-3.5" /> Quit
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Camera */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl overflow-hidden relative aspect-video" style={{ background: '#000' }}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)' }} />
            <div className="absolute bottom-3 left-3">
              <div className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                You
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="glass-card p-5">
            <div className="flex flex-col gap-3">
              {!useText ? (
                <>
                  {!recording ? (
                    <button onClick={startRecording} disabled={submitting}
                      className="btn-primary w-full">
                      <Mic className="w-5 h-5" />
                      Start Speaking
                    </button>
                  ) : (
                    <button onClick={stopRecording}
                      className="w-full font-bold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 text-white recording-pulse transition-all"
                      style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
                      <MicOff className="w-5 h-5" />
                      Stop & Submit
                    </button>
                  )}
                  <button onClick={() => setUseText(true)} className="btn-ghost w-full text-sm">
                    <MessageSquare className="w-4 h-4" />
                    Type instead
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={textAnswer} onChange={e => setTextAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    className="input-dark resize-none"
                    style={{ paddingLeft: '1rem' }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setUseText(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
                    <button onClick={() => processAnswer(null, textAnswer)} disabled={!textAnswer.trim() || submitting} className="btn-primary flex-1 text-sm">
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Question Panel */}
        <div className="lg:col-span-3">
          <div className="glass-card p-8 h-full min-h-64 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">AI Interviewer</p>
                <p className="text-sm text-slate-500">Alex • VisionHire</p>
              </div>
            </div>

            <div className="flex-1">
              {!currentQuestionText ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 rounded-lg w-3/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-4 rounded-lg w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-4 rounded-lg w-5/6" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  <p className="text-xs text-slate-600 mt-4 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing your first question...
                  </p>
                </div>
              ) : (
                <p className="text-base md:text-lg font-medium text-white leading-relaxed">
                  {currentQuestionText}
                </p>
              )}
            </div>

            {submitting && currentQuestionText && (
              <div className="mt-6 flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-sm">Interviewer is thinking...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
