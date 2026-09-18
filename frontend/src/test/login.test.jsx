import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Controllable mock login so each test can succeed or fail on demand.
const { authValue } = vi.hoisted(() => ({ authValue: { login: null } }));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isAuthed: false,
    login: authValue.login,
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    setUser: vi.fn(),
  }),
}));

import Login from '../pages/Login.jsx';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login?next=/app']}>
      <Login />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authValue.login = vi.fn().mockResolvedValue({ id: 'u1' });
});

describe('Login page', () => {
  it('renders the login form with key fields', () => {
    renderLogin();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeDefined();
  });

  it('requires the fields to be filled in', () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByLabelText('Email')).toBeInvalid();
  });

  it('calls login with the submitted credentials', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(authValue.login).toHaveBeenCalledWith('a@b.co', 'password123'));
  });

  it('shows a friendly error message when login fails', async () => {
    authValue.login = vi.fn().mockRejectedValue(new Error('Wrong password.'));
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Wrong password/);
  });
});