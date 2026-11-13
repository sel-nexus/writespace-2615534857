/** Exercise blog routes through their visible behavior. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

const alice = { userId: 'alice', username: 'alice', displayName: 'Alice', role: 'user' };
const bobPost = { id: 'bob-post', title: 'Bob story', content: 'Bob text', createdAt: '2024-01-01T00:00:00Z', authorId: 'bob', authorName: 'Bob' };
const alicePost = { id: 'alice-post', title: 'Alice story', content: 'Alice text', createdAt: '2025-01-01T00:00:00Z', authorId: 'alice', authorName: 'Alice' };
function show(path) { return render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>); }
function session(value = alice) { localStorage.setItem('writespace_session', JSON.stringify(value)); }
function seed(posts) { localStorage.setItem('writespace_posts', JSON.stringify(posts)); }
beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('blog routes', () => {
  it('lists newest first with edit only for owned posts', () => {
    session(); seed([bobPost, alicePost]); show('/blogs');
    expect(screen.getAllByRole('heading', { level: 3 }).map((node) => node.textContent)).toEqual(['Alice story', 'Bob story']);
    expect(screen.getByRole('link', { name: 'Edit Alice story' })).toHaveAttribute('href', '/edit/alice-post');
    expect(screen.queryByRole('link', { name: 'Edit Bob story' })).not.toBeInTheDocument();
  });
  it('validates, creates, reads and edits an owned post', async () => {
    session(); const user = userEvent.setup(); show('/write');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Content is required.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Title'), 'My story');
    await user.type(screen.getByLabelText('Content'), 'Hello world');
    expect(screen.getByText('11 characters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('heading', { name: 'My story' })).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Edit' }));
    expect(screen.getByLabelText('Title')).toHaveValue('My story');
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Revised story');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('heading', { name: 'Revised story' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('writespace_posts'))[0].authorId).toBe('alice');
  });
  it('prevents direct editing and hides actions for another author', () => {
    session(); seed([bobPost]); const view = show('/blog/bob-post');
    expect(screen.getByText('Bob text')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    view.unmount(); show('/edit/bob-post');
    expect(screen.getByRole('heading', { name: 'All Blogs' })).toBeInTheDocument();
  });
  it('requires confirmation before deleting and returns to the list', async () => {
    session(); seed([alicePost]); const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    show('/blog/alice-post');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(screen.getByText('No blogs yet. Be the first to write one!')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([]);
  });
  it.each(['/blog/missing', '/edit/missing'])('shows a missing state for %s', (path) => {
    session(); show(path);
    expect(screen.getByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to All Posts' })).toHaveAttribute('href', '/blogs');
  });
  it('reports corrupt storage without replacing it when saving', async () => {
    session(); localStorage.setItem('writespace_posts', 'invalid'); const user = userEvent.setup(); show('/write');
    await user.type(screen.getByLabelText('Title'), 'Title');
    await user.type(screen.getByLabelText('Content'), 'Content');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/storage/i);
    expect(localStorage.getItem('writespace_posts')).toBe('invalid');
  });
  it('shows a write failure and retains the form data', async () => {
    session(); const user = userEvent.setup(); show('/write');
    await user.type(screen.getByLabelText('Title'), 'Title');
    await user.type(screen.getByLabelText('Content'), 'Content');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/storage/i);
    expect(screen.getByLabelText('Content')).toHaveValue('Content');
  });
  it('allows an admin to manage another writer’s post', async () => {
    session({ userId: 'admin', username: 'admin', displayName: 'Admin', role: 'admin' }); seed([bobPost]);
    const user = userEvent.setup(); vi.spyOn(window, 'confirm').mockReturnValue(true); show('/blog/bob-post');
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('heading', { name: 'All Blogs' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([]);
  });
  it('guards all blog routes for guests', () => {
    const view = show('/write');
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument();
    expect(within(document.querySelector('main')).queryByLabelText('Title')).not.toBeInTheDocument();
    view.unmount();
  });
});
