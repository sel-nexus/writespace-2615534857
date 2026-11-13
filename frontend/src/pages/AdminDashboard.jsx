/** Summarize local accounts and provide administration of recent posts. */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { listAccounts } from '../utils/accounts';
import { deletePost, formatPostDate, listPosts } from '../utils/posts';

/** Render statistics, quick actions and the five newest posts. */
export default function AdminDashboard({ session }) {
  const [posts, setPosts] = useState(listPosts);
  const [accounts, setAccounts] = useState(listAccounts);
  const [error, setError] = useState('');
  useEffect(() => {
    function refresh(event) {
      if (event.key === 'writespace_posts' || event.key === null) setPosts(listPosts());
      if (event.key === 'writespace_users' || event.key === null) setAccounts(listAccounts());
    }
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  function handleDelete(post) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    const result = deletePost(post.id, session);
    if (result.error) setError(result.error);
    else { setError(''); setPosts(listPosts()); }
  }
  const stats = [
    { label: 'Total Posts', count: posts.posts.length, color: 'border-t-indigo-500' },
    { label: 'Total Users', count: accounts.accounts.length, color: 'border-t-violet-500' },
    { label: 'Total Admins', count: accounts.accounts.filter((account) => account.role === 'admin').length, color: 'border-t-pink-500' },
    { label: 'Total users', count: accounts.accounts.filter((account) => account.role === 'user').length, color: 'border-t-teal-500' },
  ];
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white sm:p-8">
        <p className="text-sm font-medium text-violet-100">Your local workspace</p>
        <h1 className="mt-2 text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-violet-100">Welcome, {session.displayName}.</p>
      </header>
      {(posts.error || accounts.error || error) && <p
        role="alert"
        className="mt-6 rounded-lg bg-red-50 p-3 text-red-700"
      >{error || posts.error || accounts.error}</p>}
      <section aria-label="Statistics" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/write"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
        >Write New Post</Link>
        <Link
          to="/users"
          className="rounded-lg border border-indigo-200 bg-white px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
        >Manage Users</Link>
      </div>
      <section className="mt-10" aria-labelledby="recent-posts">
        <h2 id="recent-posts" className="text-xl font-bold text-slate-900">Recent Posts</h2>
        {posts.posts.length === 0 ? <p className="mt-4 text-slate-600">No posts yet.</p> : (
          <ul className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {posts.posts.slice(0, 5).map((post) => (
              <li key={post.id} className="flex flex-col gap-4 border-b border-slate-100 p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    to={`/blog/${encodeURIComponent(post.id)}`}
                    className="break-words font-semibold text-slate-900 hover:text-indigo-700"
                  >{post.title}</Link>
                  <p className="mt-1 text-sm text-slate-500">{post.authorName || 'Unknown author'} · {formatPostDate(post.createdAt)}</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    aria-label={`Edit ${post.title}`}
                    to={`/edit/${encodeURIComponent(post.id)}`}
                    className="rounded-lg border border-indigo-200 px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                  >Edit</Link>
                  <button
                    type="button"
                    aria-label={`Delete ${post.title}`}
                    onClick={() => handleDelete(post)}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"
                  >Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
AdminDashboard.propTypes = { session: PropTypes.shape({ userId: PropTypes.string.isRequired, displayName: PropTypes.string.isRequired, role: PropTypes.string.isRequired }).isRequired };
