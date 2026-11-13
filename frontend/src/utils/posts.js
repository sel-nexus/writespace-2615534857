/** Manage browser-local posts without treating local permissions as security. */
import { readPosts, readUsers, savePosts } from './storage';

export const POST_STORAGE_ERROR = 'Browser storage is unavailable or unreadable. Your changes were not saved.';

/** Return whether a record has the fields required for safe display. */
export function isDisplayablePost(post) {
  return !!post && typeof post.id === 'string' && !!post.id && typeof post.title === 'string' &&
    typeof post.content === 'string' && (post.createdAt == null || typeof post.createdAt === 'string') &&
    (post.authorName == null || typeof post.authorName === 'string');
}

/** Return readable posts sorted newest first without changing the collection. */
export function listPosts() {
  const result = readPosts();
  if (!result.ok) return { posts: [], error: POST_STORAGE_ERROR };
  const posts = result.value.filter(isDisplayablePost).sort((a, b) => {
    const first = Date.parse(a.createdAt);
    const second = Date.parse(b.createdAt);
    return (Number.isFinite(second) ? second : -Infinity) - (Number.isFinite(first) ? first : -Infinity);
  });
  return { posts };
}

/** Return a readable post, or distinguish missing data from a failed read. */
export function findPost(id) {
  const result = readPosts();
  if (!result.ok) return { error: POST_STORAGE_ERROR };
  return { post: result.value.find((post) => isDisplayablePost(post) && post.id === id) };
}

/** Check whether the session may manage this post. */
export function canManagePost(session, post) {
  return !!session && ['admin', 'user'].includes(session.role) && !!session.userId && !!post &&
    (session.role === 'admin' || (typeof post.authorId === 'string' && post.authorId === session.userId));
}

/** Determine the author's role from the existing account records, defaulting to user. */
export function authorRole(post) {
  if (post.authorId === 'admin') return 'admin';
  const result = readUsers();
  return result.value.find((user) => user && user.id === post.authorId)?.role === 'admin' ? 'admin' : 'user';
}

/** Format post dates consistently with public discovery. */
export function formatPostDate(createdAt) {
  const date = new Date(createdAt);
  return typeof createdAt === 'string' && Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' })
    : 'Date unavailable';
}

/** Validate required post fields without stripping the original content. */
export function validatePost(fields) {
  return {
    ...(!fields || typeof fields.title !== 'string' || !fields.title.trim() ? { title: 'Title is required.' } : {}),
    ...(!fields || typeof fields.content !== 'string' || !fields.content.trim() ? { content: 'Content is required.' } : {}),
  };
}

/** Create or update a post after validating identity, storage, and ownership. */
export function savePost(fields, session, id) {
  const errors = validatePost(fields);
  if (Object.keys(errors).length) return { errors };
  if (!session || !['user', 'admin'].includes(session.role) || !session.userId || !session.displayName) return { error: 'You must be signed in to write a post.' };
  const result = readPosts();
  if (!result.ok) return { error: POST_STORAGE_ERROR };
  let post;
  let updated;
  if (id != null) {
    const index = result.value.findIndex((item) => item && item.id === id);
    if (index === -1 || !isDisplayablePost(result.value[index])) return { error: 'Post not found.' };
    if (!canManagePost(session, result.value[index])) return { error: 'You cannot edit this post.' };
    post = { ...result.value[index], title: fields.title.trim(), content: fields.content };
    updated = result.value.map((item, i) => i === index ? post : item);
  } else {
    let newId;
    try { newId = crypto.randomUUID(); } catch { return { error: 'Unable to create a post in this browser.' }; }
    post = { id: newId, title: fields.title.trim(), content: fields.content, createdAt: new Date().toISOString(), authorId: session.userId, authorName: session.displayName };
    updated = [...result.value, post];
  }
  return savePosts(updated) ? { post } : { error: POST_STORAGE_ERROR };
}

/** Delete an existing post only when the current session owns it or is admin. */
export function deletePost(id, session) {
  const result = readPosts();
  if (!result.ok) return { error: POST_STORAGE_ERROR };
  const index = result.value.findIndex((item) => item && item.id === id);
  if (index === -1 || !isDisplayablePost(result.value[index])) return { error: 'Post not found.' };
  if (!canManagePost(session, result.value[index])) return { error: 'You cannot delete this post.' };
  return savePosts(result.value.filter((_, i) => i !== index)) ? { ok: true } : { error: POST_STORAGE_ERROR };
}
