/** Create and edit browser-local plain-text posts. */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { canManagePost, findPost, savePost, validatePost } from '../utils/posts';

/** Render the editor and persist only authorized, valid submissions. */
export default function WriteBlog({ session }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial] = useState(() => id ? findPost(id) : {});
  const [title, setTitle] = useState(initial.post?.title || '');
  const [content, setContent] = useState(initial.post?.content || '');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  if (id && initial.error) return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="text-red-700">{initial.error}</p><Link to="/blogs" className="mt-4 inline-block text-indigo-700 underline">Back to All Posts</Link></main>;
  if (id && !initial.post) return <main className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-3xl font-bold">Post not found</h1><Link to="/blogs" className="mt-4 inline-block text-indigo-700 underline">Back to All Posts</Link></main>;
  if (id && !canManagePost(session, initial.post)) return <Navigate to="/blogs" replace />;
  function submit(event) {
    event.preventDefault();
    const fields = { title, content };
    const validation = validatePost(fields);
    setErrors(validation);
    setError('');
    if (Object.keys(validation).length) return;
    const result = savePost(fields, session, id);
    if (result.error) setError(result.error);
    else if (result.errors) setErrors(result.errors);
    else navigate(`/blog/${encodeURIComponent(result.post.id)}`);
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{id ? 'Edit post' : 'Write a post'}</h1>
      <p className="mt-3 text-slate-600">Your words are saved in this browser.</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <label htmlFor="post-title" className="block font-medium text-slate-800">Title</label>
          <input id="post-title" value={title} onChange={(event) => setTitle(event.target.value)} aria-required="true" aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {errors.title && <p id="title-error" role="alert" className="mt-2 text-sm text-red-700">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="post-content" className="block font-medium text-slate-800">Content</label>
          <textarea id="post-content" value={content} onChange={(event) => setContent(event.target.value)} aria-required="true" aria-invalid={!!errors.content} aria-describedby={errors.content ? 'content-error content-count' : 'content-count'} className="mt-2 min-h-[256px] w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <p id="content-count" className="mt-2 text-sm text-slate-600">{content.length} characters</p>
          {errors.content && <p id="content-error" role="alert" className="mt-2 text-sm text-red-700">{errors.content}</p>}
        </div>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save</button>
          <button type="button" onClick={() => navigate(-1)} className="rounded-lg px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-500">Cancel</button>
        </div>
      </form>
    </main>
  );
}
WriteBlog.propTypes = { session: PropTypes.shape({ userId: PropTypes.string, role: PropTypes.string, displayName: PropTypes.string }).isRequired };
