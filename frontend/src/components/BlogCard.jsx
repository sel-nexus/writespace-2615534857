/** Render a reusable browser-local post preview. */
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const borders = ['border-indigo-500', 'border-violet-500', 'border-pink-500', 'border-teal-500'];

/** Show a post excerpt and link to its protected reader. */
export function BlogCard({ post, index = 0 }) {
  const date = new Date(post.createdAt);
  const validDate = typeof post.createdAt === 'string' && Number.isFinite(date.getTime());
  const excerpt = post.content.slice(0, 120);

  return (
    <article className={`rounded-2xl border border-slate-200 border-t-4 bg-white shadow-sm ${borders[((index % borders.length) + borders.length) % borders.length]}`}>
      <Link to={`/blog/${encodeURIComponent(post.id)}`} className="block h-full rounded-xl p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        <p className="text-sm font-medium text-slate-600">
          {validDate ? <time dateTime={post.createdAt}>{date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' })}</time> : 'Date unavailable'}
        </p>
        <h3 className="mt-3 break-words text-xl font-bold text-slate-900">{post.title}</h3>
        <p className="mt-3 break-words leading-7 text-slate-600">{excerpt}{post.content.length > 120 ? '…' : ''}</p>
        {post.authorName && <p className="mt-5 text-sm font-medium text-slate-700">By {post.authorName}</p>}
        <span className="mt-5 inline-block text-sm font-semibold text-indigo-700">Read post <span aria-hidden="true">→</span></span>
      </Link>
    </article>
  );
}

BlogCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    authorName: PropTypes.string,
  }).isRequired,
  index: PropTypes.number,
};
