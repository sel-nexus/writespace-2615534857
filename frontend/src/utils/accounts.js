/** Manage demo accounts in browser storage; these checks are not a security boundary. */
import { ADMIN, normalizeUsername } from './auth';
import { readUsers, saveUsers } from './storage';

export const ACCOUNT_STORAGE_ERROR = 'Browser storage is unavailable or unreadable. Your changes were not saved.';
export const DEFAULT_ACCOUNT = { id: ADMIN.userId, username: ADMIN.username, displayName: ADMIN.displayName, role: ADMIN.role, createdAt: null };

/** Read accounts and include the hard-coded administrator without persisting it. */
export function listAccounts() {
  const result = readUsers();
  if (!result.ok) return { accounts: [DEFAULT_ACCOUNT], error: ACCOUNT_STORAGE_ERROR };
  return { accounts: [DEFAULT_ACCOUNT, ...result.value.filter((user) => user && typeof user.id === 'string' && typeof user.username === 'string' && typeof user.displayName === 'string' && ['admin', 'user'].includes(user.role))] };
}

/** Create a local account after checking the current administrator and input. */
export function createAccount(fields, session) {
  if (session?.role !== 'admin' || !session.userId) return { error: 'Only administrators can manage accounts.' };
  if (!fields || typeof fields.displayName !== 'string' || typeof fields.username !== 'string' || typeof fields.password !== 'string' || !fields.displayName.trim() || !fields.username.trim() || !fields.password.trim()) return { error: 'All fields are required.' };
  if (!['admin', 'user'].includes(fields.role)) return { error: 'Choose a valid role.' };
  const result = readUsers();
  if (!result.ok) return { error: ACCOUNT_STORAGE_ERROR };
  const username = fields.username.trim();
  const normalized = normalizeUsername(username);
  if (normalized === ADMIN.username || result.value.some((user) => typeof user?.username === 'string' && normalizeUsername(user.username) === normalized)) return { error: 'Username is already taken.' };
  let id;
  try { id = crypto.randomUUID(); } catch { return { error: 'Unable to create an account in this browser.' }; }
  // Passwords are intentionally plaintext for this local demo; never use real credentials.
  const account = { id, displayName: fields.displayName.trim(), username, password: fields.password, role: fields.role, createdAt: new Date().toISOString() };
  return saveUsers([...result.value, account]) ? { account } : { error: ACCOUNT_STORAGE_ERROR };
}

/** Delete an eligible account while leaving its posts untouched. */
export function deleteAccount(id, session) {
  if (session?.role !== 'admin' || !session.userId) return { error: 'Only administrators can manage accounts.' };
  if (id === ADMIN.userId) return { error: 'Default admin cannot be deleted.' };
  if (id === session.userId) return { error: 'Your active account cannot be deleted.' };
  const result = readUsers();
  if (!result.ok) return { error: ACCOUNT_STORAGE_ERROR };
  if (!result.value.some((user) => user?.id === id)) return { error: 'Account not found.' };
  return saveUsers(result.value.filter((user) => user?.id !== id)) ? { ok: true } : { error: ACCOUNT_STORAGE_ERROR };
}
