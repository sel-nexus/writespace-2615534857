/** Assemble identity routes and temporary destinations for later feature slices. */
import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicNavbar } from './components/PublicNavbar';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import Home from './pages/Home';
import ReadBlog from './pages/ReadBlog';
import WriteBlog from './pages/WriteBlog';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { clearSession, getSession } from './utils/auth';

/** Render identity flows with session state shared through props. */
export default function App() {
  const [session, setSession] = useState(getSession);
  const [error, setError] = useState('');
  const [logoutPending, setLogoutPending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    /** Refresh local identity after another tab changes storage. */
    function handleStorage(event) {
      if (event.key === 'writespace_session' || event.key === null) setSession(getSession());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (logoutPending && location.pathname === '/') {
      setSession(null);
      setLogoutPending(false);
    }
  }, [logoutPending, location.pathname]);

  /** Clear persisted identity before returning to the public page. */
  function logout() {
    if (!clearSession()) {
      setError('Unable to clear the session. Please check your browser storage settings.');
      return;
    }
    setError('');
    setLogoutPending(true);
    navigate('/');
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isPublicPage = location.pathname === '/';
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {!isAuthPage && (isPublicPage || !session ? <PublicNavbar session={session} /> : <Navbar session={session} onLogout={logout} />)}
      {error && <p role="alert" className="mx-auto max-w-6xl bg-red-50 p-3 text-red-700">{error}</p>}
      <Routes>
        <Route path="/" element={<LandingPage session={session} />} />
        <Route path="/login" element={<LoginPage session={session} onSession={setSession} />} />
        <Route path="/register" element={<RegisterPage session={session} onSession={setSession} />} />
        <Route path="/blogs" element={<ProtectedRoute session={session}><>{session && <Home session={session} />}</></ProtectedRoute>} />
        <Route path="/blog/:id" element={<ProtectedRoute session={session}><>{session && <ReadBlog session={session} />}</></ProtectedRoute>} />
        <Route path="/write" element={<ProtectedRoute session={session}><>{session && <WriteBlog key={location.pathname} session={session} />}</></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute session={session}><>{session && <WriteBlog key={location.pathname} session={session} />}</></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute session={session} role="admin"><>{session && <AdminDashboard session={session} />}</></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute session={session} role="admin"><>{session && <UserManagement session={session} />}</></ProtectedRoute>} />
        <Route path="*" element={<main className="mx-auto max-w-6xl px-6 py-16"><h1 className="text-3xl font-bold">Page not found</h1><Link to="/" className="mt-4 inline-block text-indigo-700 underline">Home</Link></main>} />
      </Routes>
    </div>
  );
}
