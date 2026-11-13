/** Show the local post collection for signed-in readers. */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { BlogCard } from '../components/BlogCard';
import { listPosts } from '../utils/posts';

/** Render posts in newest-first order with a writing entry point. */
export default function Home({ session }) {
  const [result, setResult] = useState(listPosts);
  useEffect(() => {
    function refresh(event) {
      if (event.key === 'writespace_posts' || event.key === null) setResult(listPosts());
    }
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">All Blogs</h1>
          <p className="mt-3 text-slate-600">Welcome, {session.displayName}.</p>
        </div>
        <Link
          to="/write"
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >Write a post</Link>
      </div>
      {result.error && <p role="alert" className="mt-8 text-red-700">{result.error}</p>}
      {result.posts.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {result.posts.map((post, index) => <BlogCard key={post.id} post={post} index={index} session={session} />)}
        </div>
      ) : !result.error && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
          <p>No blogs yet. Be the first to write one!</p>
          <Link to="/write" className="mt-4 inline-block font-semibold text-indigo-700 underline">Write a post</Link>
        </div>
      )}
    </main>
  );
}
Home.propTypes = { session: PropTypes.shape({ displayName: PropTypes.string.isRequired }).isRequired };
