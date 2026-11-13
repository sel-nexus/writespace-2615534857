/** Display and manage one local post. */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { authorRole, canManagePost, deletePost, findPost, formatPostDate } from '../utils/posts';

/** Render the reader, ownership-aware actions, and missing or storage states. */
export default function ReadBlog({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(() => findPost(id));
  const [error, setError] = useState('');
  useEffect(() => {
    setResult(findPost(id));
    function refresh(event) {
      if (event.key === 'writespace_posts' || event.key === null) setResult(findPost(id));
    }
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, [id]);
  function handleDelete() {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    const outcome = deletePost(id, session);
    if (outcome.error) setError(outcome.error);
    else navigate('/blogs');
  }
  const { post } = result;
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to="/blogs" className="font-medium text-indigo-700 underline">Back to All Posts</Link>
      {result.error ? <p role="alert" className="mt-8 text-red-700">{result.error}</p> : !post ? (
        <h1 className="mt-8 text-3xl font-bold">Post not found</h1>
      ) : (
        <article className="mt-8">
          <h1 className="break-words text-4xl font-bold tracking-tight text-slate-900">{post.title}</h1>
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-600">
            <Avatar role={authorRole(post)} />
            <div>
              <p className="font-medium text-slate-800">{post.authorName || 'Unknown author'}</p>
              <p>{formatPostDate(post.createdAt)}</p>
            </div>
          </div>
          <div className="mt-8 whitespace-pre-wrap break-words text-lg leading-8 text-slate-700">{post.content}</div>
          {canManagePost(session, post) && (
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to={`/edit/${encodeURIComponent(post.id)}`} className="rounded-lg border border-indigo-200 px-4 py-2 font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">Edit</Link>
              <button type="button" onClick={handleDelete} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600">Delete</button>
            </div>
          )}
          {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        </article>
      )}
    </main>
  );
}
ReadBlog.propTypes = { session: PropTypes.shape({ userId: PropTypes.string, role: PropTypes.string }).isRequired };
