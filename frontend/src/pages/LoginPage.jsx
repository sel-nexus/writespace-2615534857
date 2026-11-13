/** Offer local demo account sign-in. */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { login, roleHome } from '../utils/auth';

/** Authenticate an existing account and show actionable failures. */
export default function LoginPage({ session, onSession }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  if (session) return <Navigate to={roleHome(session.role)} replace />;
  /** Submit credentials without navigating on persistence failure. */
  function handleSubmit(event) {
    event.preventDefault();
    const result = login(username, password);
    if (result.error) return setError(result.error);
    onSession(result.session);
    navigate(roleHome(result.session.role), { replace: true });
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-indigo-100 bg-white p-7 shadow-xl shadow-indigo-100/60 sm:p-10">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-indigo-700">
          WriteSpace<span className="text-pink-500">.</span>
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-widest text-indigo-600">Your space awaits</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to your browser-local writing space.</p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="login-username" className="mb-1 block text-sm font-semibold text-slate-700">Username</label>
            <input
              id="login-username"
              autoComplete="username"
              required
              aria-required="true"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              aria-required="true"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
          >Login</button>
        </form>
        <p className="mt-6 text-sm text-slate-600">New here? <Link
          to="/register" className="font-semibold text-indigo-700 underline underline-offset-2"
        >Register</Link></p>
        <p
          className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500"
        >Local demo only: passwords are stored in plaintext. Never use real passwords. Demo admin: <strong>admin / admin</strong>.</p>
      </section>
    </main>
  );
}
LoginPage.propTypes = { session: PropTypes.object, onSession: PropTypes.func.isRequired };
