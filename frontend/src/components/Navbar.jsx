/** Provide role-aware navigation for authenticated surfaces. */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink } from 'react-router-dom';
import { Avatar } from './Avatar';

/** Render responsive navigation and a logout menu. */
export function Navbar({ session, onLogout }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const links = [{ to: '/blogs', label: 'All Blogs' }, { to: '/write', label: 'Write' }];
  if (session.role === 'admin') links.push({ to: '/users', label: 'Users' });
  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white shadow-sm">
      <nav aria-label="Account navigation" className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex min-h-16 items-center justify-between gap-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">WriteSpace<span className="text-pink-500">.</span></Link>
          <div className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>{link.label}</NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button type="button" aria-expanded={accountOpen} aria-controls="account-menu" onClick={() => setAccountOpen(!accountOpen)} className="flex items-center gap-2 rounded-lg p-1 text-sm font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                <Avatar role={session.role} />
                <span className="max-w-24 truncate sm:max-w-40">{session.displayName}</span>
                <span aria-hidden="true">▾</span>
              </button>
              {accountOpen && (
                <div id="account-menu" className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  <button type="button" onClick={() => { setAccountOpen(false); onLogout(); }} className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">Logout</button>
                </div>
              )}
            </div>
            <button type="button" aria-label="Toggle navigation" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 sm:hidden">
              <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
        {open && (
          <div id="mobile-navigation" className="flex flex-col gap-1 pb-4 sm:hidden">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-2 font-medium ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>{link.label}</NavLink>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
Navbar.propTypes = {
  session: PropTypes.shape({ role: PropTypes.oneOf(['admin', 'user']).isRequired, displayName: PropTypes.string.isRequired }).isRequired,
  onLogout: PropTypes.func.isRequired,
};
