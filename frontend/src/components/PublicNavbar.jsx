/** Provide navigation for the public landing surface. */
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';
import { roleHome } from '../utils/auth';

/** Show public links or the signed-in visitor's destination. */
export function PublicNavbar({ session }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white shadow-sm">
      <nav aria-label="Public navigation" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="text-xl font-extrabold tracking-tight text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
        >WriteSpace<span className="text-pink-500">.</span></Link>
        {session ? (
          <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto sm:flex-1 sm:gap-3">
            <Avatar role={session.role} />
            <span className="min-w-0 max-w-24 truncate font-medium text-slate-700 sm:max-w-40" title={session.displayName}>{session.displayName}</span>
            <Link
              className="shrink-0 whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
              to={roleHome(session.role)}
            >Go to Dashboard</Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
              to="/login"
            >Login</Link>
            <Link
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
              to="/register"
            >Get Started</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
PublicNavbar.propTypes = { session: PropTypes.shape({ role: PropTypes.string.isRequired, displayName: PropTypes.string.isRequired }) };
