/** Exercise administration through guarded routes and visible actions. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

const admin = { userId: 'admin', username: 'admin', displayName: 'Admin', role: 'admin' };
const writer = { id: 'writer', username: 'writer', displayName: 'Writer', password: 'demo', role: 'user', createdAt: '2024-01-01T00:00:00Z' };
const editor = { id: 'editor', username: 'editor', displayName: 'Editor', password: 'demo', role: 'admin', createdAt: '2024-01-01T00:00:00Z' };
function show(path, session = admin) {
  if (session) localStorage.setItem('writespace_session', JSON.stringify(session));
  return render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>);
}
beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('administration', () => {
  it('shows the four planned counts and only the five newest posts', () => {
    localStorage.setItem('writespace_users', JSON.stringify([writer, editor]));
    const posts = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, title: `Post ${i}`, content: 'text', authorId: 'writer', authorName: 'Writer', createdAt: `2024-01-0${i + 1}T00:00:00Z` }));
    localStorage.setItem('writespace_posts', JSON.stringify(posts));
    show('/admin');
    const stats = screen.getByRole('region', { name: 'Statistics' });
    expect(within(stats).getByText('Total Posts').parentElement).toHaveTextContent('6');
    expect(within(stats).getByText('Total Users').parentElement).toHaveTextContent('3');
    expect(within(stats).getByText('Total Admins').parentElement).toHaveTextContent('2');
    expect(within(stats).getByText('Total users').parentElement).toHaveTextContent('1');
    const recent = screen.getByRole('region', { name: 'Recent Posts' });
    expect(within(recent).getAllByRole('listitem')).toHaveLength(5);
    expect(within(recent).queryByText('Post 0')).not.toBeInTheDocument();
    expect(within(recent).getAllByRole('listitem')[0]).toHaveTextContent('Post 5');
    expect(screen.getByRole('link', { name: 'Edit Post 5' })).toHaveAttribute('href', '/edit/p5');
  });
  it('confirms post deletion, updates counts and reports write failure', async () => {
    localStorage.setItem('writespace_posts', JSON.stringify([{ id: 'p', title: 'Story', content: 'text', authorId: 'writer', createdAt: '2024-01-01' }]));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValue(true);
    const user = userEvent.setup(); show('/admin');
    await user.click(screen.getByRole('button', { name: 'Delete Story' }));
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toHaveLength(1);
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    await user.click(screen.getByRole('button', { name: 'Delete Story' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/storage/i);
    storage.mockRestore();
    await user.click(screen.getByRole('button', { name: 'Delete Story' }));
    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([]);
    expect(confirm).toHaveBeenCalledTimes(3);
  });
  it('creates both roles, rejects duplicates, and protects accounts while retaining posts', async () => {
    localStorage.setItem('writespace_users', JSON.stringify([writer]));
    localStorage.setItem('writespace_posts', JSON.stringify([{ id: 'p', authorId: 'writer', authorName: 'Writer', title: 'Story', content: 'text' }]));
    const user = userEvent.setup(); const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    show('/users');
    expect(screen.getByRole('button', { name: 'Delete admin' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i);
    await user.type(screen.getByLabelText('Display Name'), 'New Editor');
    await user.type(screen.getByLabelText('Username'), 'WRITER');
    await user.type(screen.getByLabelText('Password'), 'demo');
    await user.selectOptions(screen.getByLabelText('Role'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/taken/i);
    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'neweditor');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByRole('status')).toHaveTextContent('Account created.');
    expect(JSON.parse(localStorage.getItem('writespace_users')).find((account) => account.username === 'neweditor').role).toBe('admin');
    await user.click(screen.getByRole('button', { name: 'Delete writer' }));
    expect(screen.getByText('@writer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete writer' }));
    expect(screen.queryByText('@writer')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toHaveLength(1);
    expect(confirm).toHaveBeenCalledTimes(2);
  });
  it('disables the active administrator and reports account storage failure', async () => {
    localStorage.setItem('writespace_users', JSON.stringify([editor]));
    const user = userEvent.setup(); show('/users', { userId: 'editor', username: 'editor', displayName: 'Editor', role: 'admin' });
    expect(screen.getByRole('button', { name: 'Delete editor' })).toBeDisabled();
    await user.type(screen.getByLabelText('Display Name'), 'Another');
    await user.type(screen.getByLabelText('Username'), 'another');
    await user.type(screen.getByLabelText('Password'), 'demo');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/storage/i);
    expect(screen.getByLabelText('Username')).toHaveValue('another');
  });
  it.each(['/admin', '/users'])('redirects ordinary users from %s', (path) => {
    show(path, { userId: 'writer', username: 'writer', displayName: 'Writer', role: 'user' });
    expect(screen.getByRole('heading', { name: 'All Blogs' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'User Management' })).not.toBeInTheDocument();
  });
  it.each(['/admin', '/users'])('redirects guests from %s', (path) => {
    show(path, null);
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument();
  });
});
