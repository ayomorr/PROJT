import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Spinner } from '../components/ui.jsx';
import { DEMO_MODE } from '../lib/data.js';
import AuthShell from '../components/AuthShell.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(next && next.startsWith('/') ? next : '/app', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@scrollguard.app');
    setPassword('demo1234');
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to check in on your attention."
      footer={
        <>
          New to ScrollGuard?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
        )}

        <div>
          <label className="form-label" htmlFor="email">Email</label>
          <Input id="email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="form-label !mb-0" htmlFor="password">Password</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={busy}>
          {busy ? <Spinner size="sm" light /> : 'Log in'}
        </Button>

        {DEMO_MODE && (
          <button type="button" onClick={fillDemo}
            className="w-full text-center text-xs font-semibold text-ink-faint underline-offset-2 hover:text-brand-700 hover:underline">
            Use demo account (demo@scrollguard.app / demo1234)
          </button>
        )}
      </form>
    </AuthShell>
  );
}