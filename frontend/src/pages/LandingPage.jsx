/** Introduce WriteSpace and preview posts stored in this browser. */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { BlogCard } from '../components/BlogCard';
import { getPosts } from '../utils/storage';

const features = [
  { title: 'Write Freely', description: 'Plain-text writing, without distractions.', color: 'bg-indigo-50 border-indigo-100' },
  { title: 'Private & Local', description: 'Your data lives in this browser, not on a server.', color: 'bg-violet-50 border-violet-100' },
  { title: 'Instant & Fast', description: 'No server, no lag. Just open and write.', color: 'bg-teal-50 border-teal-100' },
];

/** Read valid preview records in newest-first order without changing storage. */
function latestPosts() {
  return getPosts()
    .filter((post) => post && typeof post.id === 'string' && post.id && typeof post.title === 'string' && typeof post.content === 'string' && (post.createdAt == null || typeof post.createdAt === 'string') && (post.authorName == null || typeof post.authorName === 'string'))
    .sort((a, b) => {
      const aDate = typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : NaN;
      const bDate = typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : NaN;
      return (Number.isFinite(bDate) ? bDate : -Infinity) - (Number.isFinite(aDate) ? aDate : -Infinity);
    })
    .slice(0, 3);
}

/** Render the public landing and role-aware entry points. */
export default function LandingPage({ session }) {
  const [posts, setPosts] = useState(latestPosts);

  useEffect(() => {
    /** Refresh the preview when a different tab changes local posts. */
    function handleStorage(event) {
      if (event.key === 'writespace_posts' || event.key === null) setPosts(latestPosts());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <>
      <main>
        <section className="overflow-hidden bg-indigo-700 text-white">
          <div className="mx-auto grid min-h-[calc(100dvh-73px)] max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-100">A little room to think</p>
              <h1 className="mt-5 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">WriteSpace.</h1>
              <p className="mt-6 max-w-lg text-xl leading-8 text-indigo-50 sm:text-2xl">Your thoughts. Your space. Beautifully simple.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to={session ? '/blogs' : '/login'}
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >Start Reading</Link>
                <Link
                  to="/register"
                  className="rounded-lg border border-white px-5 py-3 font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >Get Started Free</Link>
              </div>
            </div>
            <div className="mx-auto w-full max-w-md motion-safe:animate-bounce">
              <div className="rounded-2xl border-t-4 border-pink-500 bg-white p-8 text-slate-800 shadow-xl sm:p-10">
                <p className="text-sm font-semibold text-indigo-700">Your space to write</p>
                <p className="mt-4 text-2xl font-bold leading-tight">A home for your next idea.</p>
                <p className="mt-4 leading-7 text-slate-600">Write in plain text and keep your posts right here in your browser.</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="features-heading" className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Made for the words that matter.</h2>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className={`rounded-2xl border p-7 ${feature.color}`}>
                <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-700">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="latest-heading" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="latest-heading" className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Latest from the Blog</h2>
            <p className="mt-3 text-slate-600">Recent posts saved in this browser.</p>
            {posts.length ? (
              <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, index) => <BlogCard key={post.id} post={post} index={index} />)}
              </div>
            ) : (
              <p className="mt-9 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-700">No posts yet — check back soon!</p>
            )}
          </div>
        </section>
      </main>
      <footer className="bg-slate-900 text-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} WriteSpace. All rights reserved.</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium">
            <Link
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              to="/"
            >Home</Link>
            <Link
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              to="/blogs"
            >All Blogs</Link>
            <Link
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              to="/login"
            >Login</Link>
            <Link
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              to="/register"
            >Register</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

LandingPage.propTypes = {
  session: PropTypes.shape({ role: PropTypes.oneOf(['admin', 'user']).isRequired }),
};
