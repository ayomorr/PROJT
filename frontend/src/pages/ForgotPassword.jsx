import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as data from '../lib/data.js';
import { Button, Input, Spinner } from '../components/ui.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | sent | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setState('busy');
    try {
      await data.authApi.forgotPassword(email.trim());
      setState('sent');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setState('error');
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link>
        </>
      }
    >
      {state === 'sent' ? (
        <div className="space-y-4 text-center">
          <p className="text-4xl" aria-hidden="true">📬</p>
          <p className="text-sm leading-relaxed text-ink-soft">
            If an account exists for <strong className="text-ink">{email}</strong>, we've just sent a
            password-reset link. Give it a couple of minutes.
          </p>
          <Link to="/login" className="inline-block"><Button variant="secondary">Back to login</Button></Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
          )}
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button type="submit" variant="primary" fullWidth disabled={state === 'busy'}>
            {state === 'busy' ? <Spinner size="sm" light /> : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}