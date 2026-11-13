/** Create and remove browser-local demo accounts. */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { UserRow } from '../components/UserRow';
import { createAccount, deleteAccount, listAccounts } from '../utils/accounts';

const emptyForm = { displayName: '', username: '', password: '', role: 'user' };

/** Render the account form and responsive account list. */
export default function UserManagement({ session }) {
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(listAccounts);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    function refresh(event) {
      if (event.key === 'writespace_users' || event.key === null) setResult(listAccounts());
    }
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  function handleSubmit(event) {
    event.preventDefault();
    const outcome = createAccount(form, session);
    setNotice('');
    if (outcome.error) return setError(outcome.error);
    setError(''); setForm(emptyForm); setResult(listAccounts()); setNotice('Account created.');
  }
  function handleDelete(account) {
    if (!window.confirm(`Delete account ${account.username}? Their posts will remain.`)) return;
    const outcome = deleteAccount(account.id, session);
    setNotice('');
    if (outcome.error) return setError(outcome.error);
    setError(''); setResult(listAccounts()); setNotice('Account deleted. Their posts remain.');
  }
  const fields = [
    { key: 'displayName', label: 'Display Name', autoComplete: 'name' },
    { key: 'username', label: 'Username', autoComplete: 'off' },
    { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  ];
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/admin" className="font-medium text-indigo-700 underline">Back to Dashboard</Link>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">User Management</h1>
      <p className="mt-2 text-slate-600">Create and manage accounts in this browser.</p>
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="create-account">
        <h2 id="create-account" className="text-xl font-bold">Create Account</h2>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          {fields.map((field) => (
            <div key={field.key}>
              <label htmlFor={field.key} className="mb-1 block text-sm font-semibold text-slate-700">{field.label}</label>
              <input id={field.key} type={field.type || 'text'} autoComplete={field.autoComplete} required aria-required="true" value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          ))}
          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
            <select id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option value="user">user</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {(error || result.error) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error || result.error}</p>}
          {notice && <p role="status" className="text-sm text-slate-700 sm:col-span-2">{notice}</p>}
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">Create Account</button>
          </div>
        </form>
        <p className="mt-4 text-xs text-slate-500">Local demo only: passwords are stored in plaintext. Never use a real password.</p>
      </section>
      <section className="mt-10" aria-labelledby="accounts-heading">
        <h2 id="accounts-heading" className="text-xl font-bold">Accounts</h2>
        <ul className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {result.accounts.map((account) => <UserRow key={account.id} account={account} currentId={session.userId} onDelete={handleDelete} />)}
        </ul>
      </section>
    </main>
  );
}
UserManagement.propTypes = { session: PropTypes.shape({ userId: PropTypes.string.isRequired, role: PropTypes.string.isRequired }).isRequired };
