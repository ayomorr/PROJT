import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input, Spinner } from '../components/ui.jsx';
import { DEMO_MODE } from '../lib/data.js';
import AuthShell from '../components/AuthShell.jsx';

const PASSWORD_RULES = [/[a-z]/, /[A-Z]/, /\d/, /[a-z].{8,}/i];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const passwordOk = form.password.length >= 8 && PASSWORD_RULES.slice(0, 3).every((r) => r.test(form.password));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (!passwordOk) return setError('Password must be at least 8 characters with upper, lower and a number.');
    setBusy(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start scrolling with intention. Free to begin."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
        )}

        <div>
          <label className="form-label" htmlFor="name">Name</label>
          <Input id="name" autoComplete="name" required value={form.name} onChange={set('name')} placeholder="Alex" />
        </div>

        <div>
          <label className="form-label" htmlFor="email">Email</label>
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </div>

        <div>
          <label className="form-label" htmlFor="password">Password</label>
          <Input id="password" type="password" autoComplete="new-password" required value={form.password} onChange={set('password')} placeholder="••••••••" />
          <p className="mt-1 text-xs text-ink-faint">8+ characters, upper &amp; lower case letters, and a number.</p>
        </div>

        <div>
          <label className="form-label" htmlFor="confirm">Confirm password</label>
          <Input id="confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} placeholder="••••••••" />
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={busy || !passwordOk}>
          {busy ? <Spinner size="sm" light /> : 'Create account'}
        </Button>

        {DEMO_MODE && (
          <p className="text-center text-xs text-ink-faint">
            Demo mode: a demo account (demo@scrollguard.app / demo1234) is available on the login page.
          </p>
        )}
      </form>
    </AuthShell>
  );
}