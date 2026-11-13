/** Exercise identity routes through visible user interactions. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/** Render the app at a chosen client route. */
function show(path) {
  return render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>);
}

describe('identity experience', () => {
  it.each(['/blogs', '/blog/1', '/write', '/edit/1', '/admin', '/users'])('redirects guests from %s', (path) => {
    show(path);
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument();
  });

  it('registers, persists, guards admin navigation and logs out', async () => {
    const user = userEvent.setup();
    show('/register');
    await user.type(screen.getByLabelText('Display Name'), 'Alice Writer');
    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'demo');
    await user.type(screen.getByLabelText('Confirm Password'), 'demo');
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByText('Welcome, Alice Writer.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('writespace_session')).role).toBe('user');
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Alice Writer/ }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(localStorage.getItem('writespace_session')).toBeNull();
    expect(screen.getByRole('heading', { name: 'WriteSpace.' })).toBeInTheDocument();
  });

  it('reports invalid credentials and accepts built-in admin', async () => {
    const user = userEvent.setup();
    show('/login');
    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid username or password.');
    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
  });

  it('rejects invalid registration and reports denied storage', async () => {
    const user = userEvent.setup();
    show('/register');
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('alert')).toHaveTextContent('All fields are required.');
    await user.type(screen.getByLabelText('Display Name'), 'Alice');
    await user.type(screen.getByLabelText('Username'), 'alice');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'demo');
    await user.type(screen.getByLabelText('Confirm Password'), 'other');
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.');
    await user.clear(screen.getByLabelText('Confirm Password'));
    await user.type(screen.getByLabelText('Confirm Password'), 'demo');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    await user.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Browser storage');
    expect(screen.getByRole('heading', { name: 'Start writing.' })).toBeInTheDocument();
  });

  it('redirects a signed-in user from admin and auth pages to their home', () => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'u', username: 'alice', displayName: 'Alice', role: 'user' }));
    const view = show('/users');
    expect(screen.getByRole('heading', { name: 'All Blogs' })).toBeInTheDocument();
    view.unmount();
    show('/login');
    expect(screen.getByRole('heading', { name: 'All Blogs' })).toBeInTheDocument();
  });
});
