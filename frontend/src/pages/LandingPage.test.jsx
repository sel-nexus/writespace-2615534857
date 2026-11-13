/** Exercise public discovery and local preview behavior. */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/** Render the application at the landing route. */
function showLanding() {
  return render(<MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>);
}

const post = (id, title, createdAt, content = 'A local story.') => ({ id, title, createdAt, content, authorName: 'Alice', authorId: 'alice' });

describe('public discovery', () => {
  it('shows product features, empty preview, footer and guest links', () => {
    showLanding();
    expect(screen.getByRole('heading', { name: 'WriteSpace.' })).toBeInTheDocument();
    expect(screen.getByText('Your thoughts. Your space. Beautifully simple.')).toBeInTheDocument();
    for (const name of ['Write Freely', 'Private & Local', 'Instant & Fast']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(screen.getByText('No posts yet — check back soon!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Reading' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Get Started Free' })).toHaveAttribute('href', '/register');
    const footer = screen.getByRole('navigation', { name: 'Footer navigation' });
    for (const [name, path] of [['Home', '/'], ['All Blogs', '/blogs'], ['Login', '/login'], ['Register', '/register']]) {
      expect(within(footer).getByRole('link', { name })).toHaveAttribute('href', path);
    }
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} WriteSpace`))).toBeInTheDocument();
  });

  it('sorts newest posts, limits to three, shows excerpts and routes a guest to login', async () => {
    const user = userEvent.setup();
    localStorage.setItem('writespace_posts', JSON.stringify([
      post('old', 'Oldest post', '2023-01-01T12:00:00Z'),
      post('latest', 'Latest post', '2025-04-03T12:00:00Z', 'x'.repeat(121)),
      post('second', 'Second post', '2025-03-01T12:00:00Z'),
      post('third', 'Third post', '2024-01-01T12:00:00Z'),
    ]));
    showLanding();
    const section = screen.getByRole('region', { name: 'Latest from the Blog' });
    expect(within(section).getAllByRole('heading', { level: 3 }).map((element) => element.textContent)).toEqual(['Latest post', 'Second post', 'Third post']);
    expect(within(section).queryByText('Oldest post')).not.toBeInTheDocument();
    expect(within(section).getByText(`${'x'.repeat(120)}…`)).toBeInTheDocument();
    expect(within(section).getByText('Apr 03, 2025')).toBeInTheDocument();
    const card = within(section).getByRole('link', { name: /Latest post/ });
    expect(card).toHaveAttribute('href', '/blog/latest');
    await user.click(card);
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument();
  });

  it.each(['not json', '{"bad":true}'])('handles corrupt local storage (%s)', (data) => {
    localStorage.setItem('writespace_posts', data);
    showLanding();
    expect(screen.getByText('No posts yet — check back soon!')).toBeInTheDocument();
  });

  it('ignores malformed records and handles missing dates', () => {
    localStorage.setItem('writespace_posts', JSON.stringify([null, { id: 'bad', title: {}, content: 'bad' }, post('valid', 'Valid post', null)]));
    showLanding();
    expect(screen.getByRole('heading', { name: 'Valid post' })).toBeInTheDocument();
    expect(screen.getByText('Date unavailable')).toBeInTheDocument();
  });

  it('shows a graceful empty state when local storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    showLanding();
    expect(screen.getByText('No posts yet — check back soon!')).toBeInTheDocument();
  });

  it.each([['user', '/blogs'], ['admin', '/admin']])('shows the %s dashboard destination and sends reading to blogs', (role, destination) => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'id', username: 'writer', displayName: 'Writer', role }));
    showLanding();
    expect(screen.getByRole('link', { name: 'Go to Dashboard' })).toHaveAttribute('href', destination);
    expect(screen.getByRole('link', { name: 'Start Reading' })).toHaveAttribute('href', '/blogs');
    expect(screen.getByText('Writer')).toBeInTheDocument();
  });

  it('refreshes the preview after another tab changes posts', () => {
    showLanding();
    localStorage.setItem('writespace_posts', JSON.stringify([post('new', 'From another tab', '2025-01-01T00:00:00Z')]));
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'writespace_posts' })));
    expect(screen.getByRole('heading', { name: 'From another tab' })).toBeInTheDocument();
  });
});
