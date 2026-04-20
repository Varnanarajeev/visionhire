import { Routes, Route, Navigate } from 'react-router-dom';
import EntryPage from './pages/EntryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import InterviewSessionPage from './pages/InterviewSessionPage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import CompletionPage from './pages/CompletionPage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import RecruiterDashboardPage from './pages/RecruiterDashboardPage';
import CreateInvitePage from './pages/CreateInvitePage';
import InviteLandingPage from './pages/InviteLandingPage';
import Layout from './components/Layout';
import { auth } from './lib/auth';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  if (!auth.isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }: { children: JSX.Element }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<EntryPage />} />
      <Route path="/entry" element={<EntryPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/:code" element={<InviteLandingPage />} />

      {/* Protected — with sidebar layout */}
      <Route path="/home" element={<AppLayout><HomePage /></AppLayout>} />
      <Route path="/about" element={<AppLayout><AboutPage /></AppLayout>} />
      <Route path="/admin" element={<AppLayout><AdminPage /></AppLayout>} />
      <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
      <Route path="/progress" element={<AppLayout><ProgressPage /></AppLayout>} />
      <Route path="/upload" element={<AppLayout><ResumeUploadPage /></AppLayout>} />
      <Route path="/completion" element={<AppLayout><CompletionPage /></AppLayout>} />
      <Route path="/recruiter" element={<AppLayout><RecruiterDashboardPage /></AppLayout>} />
      <Route path="/recruiter/create" element={<AppLayout><CreateInvitePage /></AppLayout>} />

      {/* Interview — full screen, no sidebar */}
      <Route path="/interview" element={
        <ProtectedRoute><InterviewSessionPage /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
