import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, Home, User, BarChart3, Info, Upload, LogOut, X, Shield, Sun, Moon, Briefcase } from 'lucide-react';
import { auth } from '../lib/auth';
import { useState, useEffect } from 'react';
import OnboardingTour from './OnboardingTour';

const navItems = [
    { to: '/home', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { to: '/progress', icon: <BarChart3 className="w-5 h-5" />, label: 'Progress' },
    { to: '/upload', icon: <Upload className="w-5 h-5" />, label: 'New Interview' },
    { to: '/profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
    { to: '/about', icon: <Info className="w-5 h-5" />, label: 'About' },
];

const ADMIN_EMAIL = 'admin@visionhire.com';

export default function Layout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [showTour, setShowTour] = useState(() => !localStorage.getItem('onboarding_done'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'candidate');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        fetch('http://localhost:8000/settings/public')
            .then(r => r.json())
            .then(d => { if (d.announcement) setAnnouncement(d.announcement); })
            .catch(() => { });
        // Fetch user role
        const token = auth.getToken();
        if (token) {
            fetch('http://localhost:8000/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json())
                .then(d => { if (d.role) { setUserRole(d.role); localStorage.setItem('userRole', d.role); } })
                .catch(() => { });
        }
    }, []);

    const handleLogout = () => { auth.logout(); navigate('/login'); };

    const email = auth.getUserEmail() || 'User';
    const initials = email[0].toUpperCase();

    const Sidebar = () => (
        <div className="h-full flex flex-col py-6 px-4" style={{ background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Logo */}
            <NavLink to={userRole === 'recruiter' || userRole === 'admin' ? '/recruiter' : '/home'} className="flex items-center gap-2.5 mb-10 px-2">
                <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-white">VisionHire</span>
            </NavLink>

            {/* Nav */}
            <nav className="flex-1 space-y-1">
                {navItems.filter(item => {
                    if (userRole === 'recruiter' || userRole === 'admin') {
                        return ['/home', '/profile', '/about'].includes(item.to);
                    }
                    return true;
                }).map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? 'text-white gradient-bg shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`
                        }
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}
                {/* Recruiter link — only for recruiter role */}
                {(userRole === 'recruiter' || userRole === 'admin') && (
                    <NavLink to="/recruiter" onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? 'text-white shadow-lg'
                                : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-500/5'
                            }`
                        }
                        style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(79,70,229,0.2))' } : {}}
                    >
                        <Briefcase className="w-5 h-5" /> Recruiter
                    </NavLink>
                )}
                {/* Admin link — only for admin email */}
                {email === ADMIN_EMAIL && (
                    <NavLink to="/admin" onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? 'text-white shadow-lg'
                                : 'text-amber-500/70 hover:text-amber-400 hover:bg-amber-500/5'
                            }`
                        }
                        style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg,rgba(245,158,11,0.3),rgba(217,119,6,0.2))' } : {}}
                    >
                        <Shield className="w-5 h-5" /> Admin
                    </NavLink>
                )}
            </nav>

            {/* Theme Toggle */}
            <button
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                className="mx-2 mb-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* User + Logout */}
            <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {initials}
                    </div>
                    <span className="text-xs text-slate-400 truncate">{email}</span>
                </div>
                <button onClick={handleLogout} className="btn-ghost w-full text-sm py-2.5 justify-start gap-3">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen" style={{ background: theme === 'light' ? '#f8fafc' : '#0a0f1e' }}>
            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-60 flex-shrink-0 fixed top-0 left-0 h-full z-20">
                <Sidebar />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-30 md:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-60 z-40">
                        <Sidebar />
                        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="flex-1 md:ml-60 min-h-screen">
                {/* Announcement Banner */}
                {announcement && !bannerDismissed && (
                    <div className="flex items-center justify-between px-5 py-2.5 text-sm font-medium" style={{ background: 'linear-gradient(90deg,rgba(245,158,11,0.25),rgba(217,119,6,0.15))', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
                        <span className="text-amber-300">📢 {announcement}</span>
                        <button onClick={() => setBannerDismissed(true)} className="text-amber-500 hover:text-amber-300 ml-4 flex-shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                )}
                {/* Mobile header */}
                <div className="md:hidden flex items-center gap-3 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10">
                        <div className="w-5 h-0.5 bg-white mb-1" /><div className="w-5 h-0.5 bg-white mb-1" /><div className="w-5 h-0.5 bg-white" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl gradient-bg flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
                        <span className="text-sm font-bold text-white">VisionHire</span>
                    </div>
                </div>
                {children}
            </main>
            {showTour && <OnboardingTour onComplete={() => { setShowTour(false); localStorage.setItem('onboarding_done', '1'); }} />}
        </div>
    );
}
