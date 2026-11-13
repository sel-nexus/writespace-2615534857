/** Verify post persistence, validation, ordering and permissions. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canManagePost, deletePost, findPost, listPosts, savePost, validatePost } from './posts';

const alice = { userId: 'alice', displayName: 'Alice', role: 'user' };
const bob = { userId: 'bob', displayName: 'Bob', role: 'user' };
const admin = { userId: 'admin', displayName: 'Admin', role: 'admin' };
const original = { id: 'one', title: 'Original', content: 'Body', authorId: 'alice', authorName: 'Alice', createdAt: '2024-01-01T00:00:00Z' };
const seed = (value) => localStorage.setItem('writespace_posts', JSON.stringify(value));
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('posts', () => {
  it('creates a post with persisted identity and reads it back', () => {
    const result = savePost({ title: '  New story  ', content: 'One\nTwo' }, alice);
    expect(result.post).toMatchObject({ title: 'New story', content: 'One\nTwo', authorId: 'alice', authorName: 'Alice' });
    expect(result.post.id).toBeTruthy();
    expect(findPost(result.post.id).post).toEqual(result.post);
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([result.post]);
  });
  it('sorts newest first and ignores malformed records for display', () => {
    seed([original, null, { ...original, id: 'new', createdAt: '2025-01-01T00:00:00Z' }, { id: 'broken' }]);
    expect(listPosts().posts.map((item) => item.id)).toEqual(['new', 'one']);
  });
  it('validates whitespace and rejects unsigned writes', () => {
    expect(validatePost({ title: '  ', content: '' })).toEqual({ title: 'Title is required.', content: 'Content is required.' });
    expect(savePost({ title: 'Good', content: 'Body' }, null).error).toMatch(/signed in/);
    expect(localStorage.getItem('writespace_posts')).toBeNull();
  });
  it('allows owner edits, preserves author and date, and rejects other writers', () => {
    seed([original]);
    expect(savePost({ title: 'Stolen', content: 'Bad' }, bob, 'one').error).toMatch(/cannot edit/);
    expect(savePost({ title: 'Edited', content: 'Better' }, alice, 'one').post).toEqual({ ...original, title: 'Edited', content: 'Better' });
    expect(canManagePost(bob, original)).toBe(false);
    expect(canManagePost(admin, original)).toBe(true);
  });
  it('lets admin edit and delete any post and reports missing IDs', () => {
    seed([original]);
    expect(savePost({ title: 'Admin edit', content: 'Text' }, admin, 'one').post.title).toBe('Admin edit');
    expect(deletePost('one', bob).error).toMatch(/cannot delete/);
    expect(deletePost('missing', admin).error).toMatch(/not found/);
    expect(deletePost('one', admin)).toEqual({ ok: true });
    expect(findPost('one').post).toBeUndefined();
  });
  it.each(['bad json', '{"not":"an array"}'])('never overwrites corrupt storage: %s', (raw) => {
    localStorage.setItem('writespace_posts', raw);
    expect(listPosts().error).toMatch(/storage/i);
    expect(savePost({ title: 'Title', content: 'Body' }, alice).error).toMatch(/storage/i);
    expect(deletePost('one', admin).error).toMatch(/storage/i);
    expect(localStorage.getItem('writespace_posts')).toBe(raw);
  });
  it.each([null, undefined, {}, { title: 1, content: 'Body' }, { title: 'Title', content: null }])('rejects malformed fields %# without changing posts', (fields) => {
    seed([original]);
    const before = localStorage.getItem('writespace_posts');
    expect(Object.keys(savePost(fields, alice).errors).length).toBeGreaterThan(0);
    expect(localStorage.getItem('writespace_posts')).toBe(before);
  });
  it.each([null, undefined, {}, { ...alice, role: 'owner' }, { ...alice, userId: '' }, { ...alice, displayName: '' }])('rejects invalid session %# for creation without changing posts', (session) => {
    seed([original]);
    const before = localStorage.getItem('writespace_posts');
    expect(savePost({ title: 'Title', content: 'Body' }, session).error).toMatch(/signed in/i);
    expect(localStorage.getItem('writespace_posts')).toBe(before);
  });
  it('preserves stored posts on missing and unauthorized edit and delete', () => {
    seed([original, { id: 'malformed' }]);
    const before = localStorage.getItem('writespace_posts');
    expect(savePost({ title: 'X', content: 'Y' }, bob, 'one').error).toMatch(/cannot edit/i);
    expect(deletePost('one', bob).error).toMatch(/cannot delete/i);
    expect(deletePost('one', null).error).toMatch(/cannot delete/i);
    expect(savePost({ title: 'X', content: 'Y' }, alice, 'missing').error).toMatch(/not found/i);
    expect(savePost({ title: 'X', content: 'Y' }, alice, 'malformed').error).toMatch(/not found/i);
    expect(deletePost('malformed', admin).error).toMatch(/not found/i);
    expect(localStorage.getItem('writespace_posts')).toBe(before);
  });
  it('preserves posts when creation cannot generate a UUID', () => {
    seed([original]);
    const before = localStorage.getItem('writespace_posts');
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => { throw new Error('unavailable'); });
    expect(savePost({ title: 'Title', content: 'Body' }, alice)).toEqual({ error: 'Unable to create a post in this browser.' });
    expect(localStorage.getItem('writespace_posts')).toBe(before);
  });
  it('preserves long title and content through creation and retrieval', () => {
    const title = 'Long title '.repeat(1000);
    const content = 'Long content with markup <b>not HTML</b>\n'.repeat(2000);
    const result = savePost({ title, content }, alice);
    expect(result.post.title).toBe(title.trim());
    expect(result.post.content).toBe(content);
    expect(findPost(result.post.id).post).toEqual(result.post);
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([result.post]);
  });
  it('reports read and write failures without changing stored data', () => {
    seed([original]);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(savePost({ title: 'Edited', content: 'Body' }, alice, 'one').error).toMatch(/storage/i);
    expect(deletePost('one', alice).error).toMatch(/storage/i);
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([original]);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    expect(findPost('one').error).toMatch(/storage/i);
    expect(savePost({ title: 'Title', content: 'Body' }, alice).error).toMatch(/storage/i);
  });
  it('reports missing posts at mutation time and keeps unrelated malformed records', () => {
    seed([null, original]);
    expect(savePost({ title: 'X', content: 'Y' }, alice, 'missing').error).toMatch(/not found/);
    expect(deletePost('one', alice)).toEqual({ ok: true });
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([null]);
  });
});
