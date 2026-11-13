/** Verify local account mutations and their failure paths. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAccount, deleteAccount, listAccounts } from './accounts';

const admin = { userId: 'admin', role: 'admin' };
const form = { displayName: ' Alice ', username: ' Alice ', password: 'demo', role: 'user' };
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('local accounts', () => {
  it('lists the built-in admin and creates both roles with persisted IDs and timestamps', () => {
    const user = createAccount(form, admin);
    const other = createAccount({ ...form, username: 'editor', role: 'admin' }, admin);
    expect(user.account).toMatchObject({ displayName: 'Alice', username: 'Alice', role: 'user' });
    expect(user.account.id).toBeTruthy();
    expect(Number.isFinite(Date.parse(user.account.createdAt))).toBe(true);
    expect(other.account.role).toBe('admin');
    expect(listAccounts().accounts.map((account) => account.username)).toEqual(['admin', 'Alice', 'editor']);
    expect(JSON.parse(localStorage.getItem('writespace_users'))).toHaveLength(2);
  });
  it('rejects blank fields, invalid roles, reserved and case-insensitive duplicate usernames', () => {
    expect(createAccount({ ...form, password: ' ' }, admin).error).toMatch(/required/i);
    expect(createAccount({ ...form, role: 'owner' }, admin).error).toMatch(/role/i);
    expect(createAccount({ ...form, username: ' ADMIN ' }, admin).error).toMatch(/taken/i);
    createAccount(form, admin);
    expect(createAccount({ ...form, username: 'alice' }, admin).error).toMatch(/taken/i);
    expect(JSON.parse(localStorage.getItem('writespace_users'))).toHaveLength(1);
  });
  it('refuses unauthorized, default, current and missing account deletion', () => {
    expect(createAccount(form, { userId: 'u', role: 'user' }).error).toMatch(/administrators/i);
    expect(deleteAccount('admin', admin).error).toMatch(/default/i);
    const account = createAccount(form, admin).account;
    expect(deleteAccount(account.id, { userId: account.id, role: 'admin' }).error).toMatch(/active/i);
    expect(deleteAccount(account.id, { userId: 'u', role: 'user' }).error).toMatch(/administrators/i);
    expect(deleteAccount('missing', admin).error).toMatch(/not found/i);
    expect(listAccounts().accounts).toHaveLength(2);
  });
  it('deletes an eligible account without touching posts', () => {
    const account = createAccount(form, admin).account;
    const posts = [{ id: 'p', authorId: account.id, authorName: 'Alice' }];
    localStorage.setItem('writespace_posts', JSON.stringify(posts));
    expect(deleteAccount(account.id, admin)).toEqual({ ok: true });
    expect(listAccounts().accounts).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual(posts);
  });
  it('preserves corrupt data and reports storage write failures', () => {
    localStorage.setItem('writespace_users', 'invalid');
    expect(listAccounts().error).toMatch(/storage/i);
    expect(createAccount(form, admin).error).toMatch(/storage/i);
    expect(deleteAccount('other', admin).error).toMatch(/storage/i);
    expect(localStorage.getItem('writespace_users')).toBe('invalid');
    localStorage.removeItem('writespace_users');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(createAccount(form, admin).error).toMatch(/storage/i);
    expect(localStorage.getItem('writespace_users')).toBeNull();
  });
});
