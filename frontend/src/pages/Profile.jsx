import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import * as data from '../lib/data.js';
import { Button, Card, DemoBadge, Input, Modal, Toggle, useToast } from '../components/ui.jsx';
import { fmtClock } from '../lib/format.js';

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoal || 90);
  const [firstDay, setFirstDay] = useState(user?.firstDay || '');
  const [lastSeen, setLastSeen] = useState(user?.lastSeen || '');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveProfile = async () => {
    setBusy(true);
    try {
      await data.userApi.update({ name: name.trim(), dailyGoal: Number(dailyGoal) });
      await refresh();
      toast('Profile updated ✓');
    } catch (err) {
      toast(err.message || 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await data.userApi.deleteAccount();
      toast('Account deleted. You can always come back.');
      setConfirmDelete(false);
      await logout();
      navigate('/');
    } catch (err) {
      toast(err.message || 'Could not delete account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Your profile</h1>
        <p className="mt-1 text-sm text-ink-soft">Your data, your rules. You can change or erase any of it.</p>
        {user?.demo && <div className="mt-2"><DemoBadge /></div>}
      </header>

      <Card className="p-6">
        <div className="mb-5 flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-xl font-extrabold text-brand-700">
            {(user?.name || 'U').slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="font-bold text-ink">{user?.name}</p>
            <p className="text-sm text-ink-soft">{user?.email}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="name">Name</label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="form-label" htmlFor="goal">Daily time goal (minutes)</label>
            <Input id="goal" type="number" min={15} max={300} value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label" htmlFor="times">You usually scroll</label>
            <p className="text-sm text-ink-soft">{user?.scrollTimes?.length ? user.scrollTimes.join(' · ') : 'Not set yet'}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary" onClick={saveProfile} disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
          <Button variant="secondary" onClick={() => { logout(); navigate('/'); }}>Log out</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-3 font-bold text-ink">Your data</h2>
        <p className="text-sm text-ink-soft">
          We store the sessions you log and the limits you set — nothing else. Export (coming soon) downloads your
          history as a simple file.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-ink-soft">
          <span>Joined {user?.createdAt ? fmtClock(user.createdAt) : '—'}</span>
          <span>Streak {user?.streak ?? user?.dailyStreak ?? 0} day{(user?.streak || 0) === 1 ? '' : 's'}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete my account &amp; data</Button>
        </div>
      </Card>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete everything?">
        <p className="text-sm text-ink-soft">
          This permanently deletes your account, all logged sessions, and your limits. There is no undo.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={doDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Yes, delete my data'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}