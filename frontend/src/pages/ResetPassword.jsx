import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as data from '../lib/data.js';
import { Button, Input, Spinner } from '../components/ui.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This password-reset link is missing its token.">
        <Link to="/forgot-password" className="inline-block w-full">
          <Button variant="primary" fullWidth>Request a new link</Button>
        </Link>
      </AuthShell>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await data.authApi.resetPassword(token, password);
      navigate('/login?reset=1', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Strength over speed — make it a good one.">
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
        )}
        <div>
          <label className="form-label" htmlFor="password">Password</label>
          <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <label className="form-label" htmlFor="confirm">Confirm password</label>
          <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
        <Button type="submit" variant="primary" fullWidth disabled={busy}>
          {busy ? <Spinner size="sm" light /> : 'Reset password'}
        </Button>
      </form>
    </AuthShell>
  );
}