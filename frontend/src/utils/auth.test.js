/** Verify local account and session contracts. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, getSession, login, normalizeUsername, register, roleHome, setSession } from './auth';

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

  it.each(['displayName', 'username', 'password', 'confirmPassword'])('rejects a missing %s without changing storage', (field) => {
    const fields = { ...form };
    delete fields[field];
    localStorage.setItem('writespace_users', '[]');
    localStorage.setItem('writespace_session', '{"previous":true}');
    expect(register(fields)).toEqual({ error: 'All fields are required.' });
    expect(localStorage.getItem('writespace_users')).toBe('[]');
    expect(localStorage.getItem('writespace_session')).toBe('{"previous":true}');
  });

  it.each([null, undefined, 12, false, {}, []])('rejects malformed registration input %s without mutation', (fields) => {
    expect(register(fields)).toEqual({ error: 'All fields are required.' });
    expect(localStorage.getItem('writespace_users')).toBeNull();
    expect(localStorage.getItem('writespace_session')).toBeNull();
  });

  it.each(['displayName', 'username', 'password', 'confirmPassword'])('rejects a non-string %s', (field) => {
    expect(register({ ...form, [field]: 42 })).toEqual({ error: 'All fields are required.' });
    expect(localStorage.getItem('writespace_users')).toBeNull();
    expect(localStorage.getItem('writespace_session')).toBeNull();
  });

  it.each([[null, 'demo'], [42, 'demo'], ['alice', null], ['alice', 42], ['', 'demo']])('rejects malformed login credentials %# without mutation', (username, password) => {
    localStorage.setItem('writespace_users', JSON.stringify([{ id: 'a', username: 'alice', displayName: 'Alice', role: 'user' }]));
    localStorage.setItem('writespace_session', '{"previous":true}');
    const users = localStorage.getItem('writespace_users');
    expect(login(username, password)).toEqual({ error: 'Invalid username or password.' });
    expect(localStorage.getItem('writespace_users')).toBe(users);
    expect(localStorage.getItem('writespace_session')).toBe('{"previous":true}');
  });

  it('normalizes malformed usernames safely', () => {
    expect(normalizeUsername(null)).toBe('');
    expect(normalizeUsername(3)).toBe('');
    expect(normalizeUsername(' ALICE ')).toBe('alice');
  });

  it('preserves the previous session when login cannot save a new session', () => {
    localStorage.setItem('writespace_session', '{"previous":true}');
    const beforeUsers = localStorage.getItem('writespace_users');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(login('admin', 'admin').error).toMatch(/storage/i);
    expect(localStorage.getItem('writespace_session')).toBe('{"previous":true}');
    expect(localStorage.getItem('writespace_users')).toBe(beforeUsers);
  });

  it('preserves users and session when registration cannot generate a UUID', () => {
    localStorage.setItem('writespace_users', '[]');
    localStorage.setItem('writespace_session', '{"previous":true}');
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => { throw new Error('unavailable'); });
    expect(register(form)).toEqual({ error: 'Unable to create an account in this browser.' });
    expect(localStorage.getItem('writespace_users')).toBe('[]');
    expect(localStorage.getItem('writespace_session')).toBe('{"previous":true}');
  });

  it('preserves users and session when the registration write fails', () => {
    localStorage.setItem('writespace_users', '[]');
    localStorage.setItem('writespace_session', '{"previous":true}');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(register(form).error).toMatch(/storage/i);
    expect(localStorage.getItem('writespace_users')).toBe('[]');
    expect(localStorage.getItem('writespace_session')).toBe('{"previous":true}');
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
