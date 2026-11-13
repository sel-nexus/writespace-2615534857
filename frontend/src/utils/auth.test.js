/** Verify local account and session contracts. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, getSession, login, register, roleHome, setSession } from './auth';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());
const form = { displayName: 'Alice', username: 'Alice', password: 'demo', confirmPassword: 'demo' };

describe('local identity', () => {
  it('registers and authenticates a normalized user without storing password in the session', () => {
    const created = register(form);
    expect(created.session).toMatchObject({ displayName: 'Alice', username: 'Alice', role: 'user' });
    expect(getSession()).toEqual(created.session);
    expect(getSession()).not.toHaveProperty('password');
    expect(JSON.parse(localStorage.getItem('writespace_users'))[0]).toMatchObject({ password: 'demo', role: 'user' });
    expect(clearSession()).toBe(true);
    expect(login(' alice ', 'demo').session).toEqual(created.session);
    expect(roleHome('user')).toBe('/blogs');
  });

  it('authenticates the built-in admin and rejects invalid credentials', () => {
    expect(login('admin', 'wrong').error).toBe('Invalid username or password.');
    expect(login('admin', 'admin').session).toMatchObject({ userId: 'admin', role: 'admin' });
    expect(roleHome('admin')).toBe('/admin');
  });

  it('rejects missing, mismatched, reserved and duplicate usernames', () => {
    expect(register({ ...form, displayName: '  ' }).error).toMatch(/required/);
    expect(register({ ...form, confirmPassword: 'other' }).error).toMatch(/match/);
    expect(register({ ...form, username: ' ADMIN ' }).error).toMatch(/taken/);
    register(form);
    expect(register({ ...form, username: ' ALICE ' }).error).toMatch(/taken/);
  });

  it('fails closed for invalid session shapes and inaccessible storage', () => {
    localStorage.setItem('writespace_session', '{');
    expect(getSession()).toBeNull();
    localStorage.setItem('writespace_session', JSON.stringify({ role: 'admin' }));
    expect(getSession()).toBeNull();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    expect(getSession()).toBeNull();
    expect(setSession({})).toBe(false);
    expect(clearSession()).toBe(false);
    expect(login('admin', 'admin').error).toMatch(/storage/);
    expect(register(form).error).toMatch(/storage/);
  });

  it('never overwrites a corrupt account collection', () => {
    localStorage.setItem('writespace_users', 'corrupt');
    expect(register(form).error).toMatch(/storage/);
    expect(localStorage.getItem('writespace_users')).toBe('corrupt');
    expect(login('alice', 'demo').error).toMatch(/storage/);
  });

  it('explains a successful account write followed by failed session persistence', () => {
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === 'writespace_session') throw new Error('denied');
      return original.call(this, key, value);
    });
    expect(register(form).error).toMatch(/Account saved/);
    expect(JSON.parse(localStorage.getItem('writespace_users'))).toHaveLength(1);
    expect(getSession()).toBeNull();
  });
});
