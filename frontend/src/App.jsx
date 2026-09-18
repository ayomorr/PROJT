import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ToastProvider, Spinner } from './components/ui.jsx';
import Shell from './components/Shell.jsx';
import { InstallPrompt } from './components/InstallPrompt.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Insights from './pages/Insights.jsx';
import FocusMode from './pages/FocusMode.jsx';
import Challenges from './pages/Challenges.jsx';
import Coach from './pages/Coach.jsx';
import ScrollIntent from './pages/ScrollIntent.jsx';
import PlatformsPage from './pages/PlatformsPage.jsx';
import LimitsPage from './pages/LimitsPage.jsx';
import Profile from './pages/Profile.jsx';
import Privacy from './pages/Privacy.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-14 w-14 animate-pulse-ring place-items-center rounded-[28%] text-2xl font-extrabold text-white" style={{ background: 'linear-gradient(135deg,#8379e8,#5b47d9)' }}>
          S
        </span>
        <p className="text-sm font-semibold text-ink-soft">ScrollGuard</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }) {
  const { isAuthed, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!isAuthed) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user || user.role !== 'admin') {
    return (
      <div className="grid min-h-screen place-items-center bg-surface p-6">
        <div className="card max-w-sm text-center">
          <p className="mb-2 text-3xl" aria-hidden="true">🔐</p>
          <h1 className="text-lg font-bold">Admins only</h1>
          <p className="mt-1 text-sm text-ink-soft">This dashboard is for ScrollGuard administrators.</p>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<><Landing /><InstallPrompt /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected (authed) */}
        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
        <Route path="/app" element={<RequireAuth><Shell /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="insights" element={<Insights />} />
          <Route path="focus" element={<FocusMode />} />
          <Route path="challenges" element={<Challenges />} />
          <Route path="coach" element={<Coach />} />
          <Route path="scroll" element={<ScrollIntent />} />
          <Route path="platforms" element={<PlatformsPage />} />
          <Route path="limits" element={<LimitsPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="privacy" element={<Privacy />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth><RequireAdmin><AdminMenu /></RequireAdmin></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ToastProvider>
  );
}

// Minimal admin entry — a dedicated page with the aggregated dashboard.
function AdminMenu() {
  return <Admin />;
}