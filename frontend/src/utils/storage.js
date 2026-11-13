/** Read and write browser-local post and account collections. */

/** Read a collection without hiding errors from mutation callers.
 * @param {string} key Storage key.
 * @returns {{ok: boolean, value: Array}} The parsed collection or an empty fallback.
 */
function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { ok: true, value: [] };
    const value = JSON.parse(raw);
    return Array.isArray(value) ? { ok: true, value } : { ok: false, value: [] };
  } catch {
    return { ok: false, value: [] };
  }
}

/** Persist a collection and report whether the write succeeded.
 * @param {string} key Storage key.
 * @param {Array} value Collection to persist.
 * @returns {boolean} Whether persistence succeeded.
 */
function writeArray(key, value) {
  if (!Array.isArray(value)) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Return posts or an empty fallback. */
export function getPosts() { return readArray('writespace_posts').value; }
/** Persist posts and return whether the write succeeded. */
export function savePosts(posts) { return writeArray('writespace_posts', posts); }
/** Return users or an empty fallback. */
export function getUsers() { return readArray('writespace_users').value; }
/** Return users with read status, so callers never overwrite corrupt data. */
export function readUsers() { return readArray('writespace_users'); }
/** Persist users and return whether the write succeeded. */
export function saveUsers(users) { return writeArray('writespace_users', users); }
