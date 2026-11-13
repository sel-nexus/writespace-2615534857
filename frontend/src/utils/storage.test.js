/** Exercise local collection reads and write failures. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPosts, getUsers, readUsers, savePosts, saveUsers } from './storage';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('collection storage', () => {
  it('persists posts and users independently', () => {
    expect(savePosts([{ id: 'post' }])).toBe(true);
    expect(saveUsers([{ id: 'user' }])).toBe(true);
    expect(getPosts()).toEqual([{ id: 'post' }]);
    expect(getUsers()).toEqual([{ id: 'user' }]);
  });

  it('returns empty arrays for missing, corrupt and wrong-shaped data', () => {
    expect(getPosts()).toEqual([]);
    localStorage.setItem('writespace_posts', '{bad');
    localStorage.setItem('writespace_users', '{}');
    expect(getPosts()).toEqual([]);
    expect(getUsers()).toEqual([]);
    expect(readUsers()).toEqual({ ok: false, value: [] });
  });

  it('reports denied reads and writes and refuses non-arrays', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    expect(getPosts()).toEqual([]);
    expect(readUsers().ok).toBe(false);
    expect(saveUsers([])).toBe(false);
    expect(savePosts(null)).toBe(false);
  });
});
