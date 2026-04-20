import { useState } from 'react';
import { auth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, Trash2 } from 'lucide-react';

export default function ProfilePage() {
    const navigate = useNavigate();
    const email = auth.getUserEmail() || 'user@example.com';
    const name = email.split('@')[0];
    const initials = name[0].toUpperCase();
    const [confirmed, setConfirmed] = useState(false);

    const handleLogout = () => { auth.logout(); navigate('/login'); };

    const handleClearData = () => {
        if (confirmed) {
            localStorage.removeItem('finalReport');
            localStorage.removeItem('interviewId');
            localStorage.removeItem('totalInterviews');
            localStorage.removeItem('bestScore');
            localStorage.removeItem('lastInterviewDate');
            setConfirmed(false);
            alert('Session data cleared.');
        } else {
            setConfirmed(true);
            setTimeout(() => setConfirmed(false), 5000);
        }
    };

    const infoRows = [
        { icon: <User className="w-4 h-4" />, label: 'Display Name', value: name },
        { icon: <Mail className="w-4 h-4" />, label: 'Email', value: email },
    ];

    return (
        <div className="p-6 md:p-10 max-w-2xl mx-auto">
            <h1 className="text-3xl font-black text-white mb-8 animate-fade-in-up">Profile</h1>

            {/* Avatar card */}
            <div className="glass-card p-8 flex items-center gap-6 mb-6 animate-fade-in-up">
                <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center text-3xl font-black text-white flex-shrink-0 glow-indigo">
                    {initials}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white capitalize">{name}</h2>
                    <p className="text-slate-400 text-sm mt-1">{email}</p>
                </div>
            </div>

            {/* Account Info */}
            <div className="glass-card p-6 mb-6 animate-fade-in-up">
                <h3 className="font-bold text-white mb-4">Account Details</h3>
                <div className="space-y-4">
                    {infoRows.map(r => (
                        <div key={r.label} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-500" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                {r.icon}
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 font-medium">{r.label}</p>
                                <p className="text-white text-sm font-semibold">{r.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="glass-card p-6 space-y-3 animate-fade-in-up">
                <h3 className="font-bold text-white mb-4">Actions</h3>
                <button onClick={handleLogout} className="btn-ghost w-full justify-start gap-3 text-sm">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
                <button onClick={handleClearData}
                    className={`w-full font-semibold py-3 px-5 rounded-xl flex items-center gap-3 text-sm transition-all border ${confirmed
                        ? 'text-red-300 border-red-500/40 bg-red-500/10'
                        : 'text-slate-400 border-white/08 bg-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                    style={{ borderColor: confirmed ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}>
                    <Trash2 className="w-4 h-4" />
                    {confirmed ? 'Click again to confirm clearance' : 'Clear Session Data'}
                </button>
            </div>
        </div>
    );
}
