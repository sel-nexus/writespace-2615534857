/** Offer browser-local account registration. */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { register, roleHome } from '../utils/auth';

/** Create a regular writer account after validating all fields. */
export default function RegisterPage({ session, onSession }) {
  const [form, setForm] = useState({ displayName: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  if (session) return <Navigate to={roleHome(session.role)} replace />;
  /** Persist a valid account and session before leaving the form. */
  function handleSubmit(event) {
    event.preventDefault();
    const result = register(form);
    if (result.error) return setError(result.error);
    onSession(result.session);
    navigate('/blogs', { replace: true });
  }
  const fields = [
    { key: 'displayName', label: 'Display Name', autoComplete: 'name' },
    { key: 'username', label: 'Username', autoComplete: 'username' },
    { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
    { key: 'confirmPassword', label: 'Confirm Password', type: 'password', autoComplete: 'new-password' },
  ];
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-indigo-100 bg-white p-7 shadow-xl shadow-indigo-100/60 sm:p-10">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-indigo-700">WriteSpace<span className="text-pink-500">.</span></Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-widest text-indigo-600">Make it yours</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Start writing.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Create an account in this browser.</p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
          {fields.map((field) => (
            <div key={field.key}>
              <label htmlFor={field.key} className="mb-1 block text-sm font-semibold text-slate-700">{field.label}</label>
              <input id={field.key} type={field.type || 'text'} autoComplete={field.autoComplete} required aria-required="true" value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          ))}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2">Register</button>
        </form>
        <p className="mt-6 text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-indigo-700 underline underline-offset-2">Login</Link></p>
        <p className="mt-6 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">Local demo only: passwords are stored in plaintext and are not secure. Never use a real password.</p>
      </section>
    </main>
  );
}
RegisterPage.propTypes = { session: PropTypes.object, onSession: PropTypes.func.isRequired };
