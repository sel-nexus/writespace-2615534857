/** Manage insecure browser-local demo identity, not production authorization. */
import { readUsers, saveUsers } from './storage';

// The built-in admin and plaintext passwords are intentionally insecure demo data.
export const ADMIN = { userId: 'admin', username: 'admin', displayName: 'Admin', role: 'admin' };
const storageError = 'Browser storage is unavailable or unreadable. Please check your browser settings.';

/** Return a valid session or fail closed on missing, malformed or inaccessible data. */
export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem('writespace_session'));
    if (!session || typeof session !== 'object' || !['admin', 'user'].includes(session.role) ||
        !['userId', 'username', 'displayName'].every((key) => typeof session[key] === 'string' && session[key].trim())) return null;
    return session;
  } catch {
    return null;
  }
}

/** Persist a session and report whether the write succeeded. */
export function setSession(session) {
  try {
    localStorage.setItem('writespace_session', JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

/** Remove a session and report whether the removal succeeded. */
export function clearSession() {
  try {
    localStorage.removeItem('writespace_session');
    return true;
  } catch {
    return false;
  }
}

/** Return the home route for a role. */
export function roleHome(role) { return role === 'admin' ? '/admin' : '/blogs'; }

/** Normalize a username for uniqueness and login. */
export function normalizeUsername(username) { return username.trim().toLowerCase(); }

/** Authenticate credentials and persist a password-free session. */
export function login(username, password) {
  const normalized = normalizeUsername(username);
  let session;
  if (normalized === 'admin' && password === 'admin') {
    session = ADMIN;
  } else {
    const result = readUsers();
    if (!result.ok) return { error: storageError };
    const user = result.value.find((item) => item && typeof item.username === 'string' &&
      normalizeUsername(item.username) === normalized && item.password === password &&
      typeof item.id === 'string' && item.id && typeof item.displayName === 'string' && item.displayName.trim() &&
      ['user', 'admin'].includes(item.role) && normalized !== 'admin');
    if (!user) return { error: 'Invalid username or password.' };
    session = { userId: user.id, username: user.username, displayName: user.displayName, role: user.role };
  }
  return setSession(session) ? { session } : { error: storageError };
}

/** Validate and create a regular account, then establish its session. */
export function register({ displayName, username, password, confirmPassword }) {
  const name = displayName.trim();
  const normalized = normalizeUsername(username);
  if (!name || !normalized || !password.trim() || !confirmPassword.trim()) return { error: 'All fields are required.' };
  if (password !== confirmPassword) return { error: 'Passwords do not match.' };
  const result = readUsers();
  if (!result.ok) return { error: storageError };
  if (normalized === 'admin' || result.value.some((user) => typeof user?.username === 'string' && normalizeUsername(user.username) === normalized)) {
    return { error: 'Username is already taken.' };
  }
  let id;
  try { id = crypto.randomUUID(); } catch { return { error: 'Unable to create an account in this browser.' }; }
  const user = { id, displayName: name, username: username.trim(), password, role: 'user', createdAt: new Date().toISOString() };
  if (!saveUsers([...result.value, user])) return { error: storageError };
  const session = { userId: user.id, username: user.username, displayName: user.displayName, role: user.role };
  if (!setSession(session)) return { error: 'Account saved, but the session could not be saved. Please try logging in.' };
  return { session };
}
