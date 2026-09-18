// "Install ScrollGuard" PWA install prompt (spec section 18).
//
// Listens for the browser's beforeinstallprompt event and shows a friendly bar.
// Gracefully does nothing on browsers that don't support PWA install.
import { useEffect, useState } from 'react';
import { Button } from './ui.jsx';

export function InstallPrompt({ compact = false }) {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    const installedHandler = () => setVisible(false);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;
  if (compact) {
    return (
      <Button variant="secondary" onClick={install} className="w-full">
        ⬇️ Install ScrollGuard
      </Button>
    );
  }
  return (
    <div className="animate-fade-up fixed bottom-24 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:bottom-8">
      <div className="card flex items-center gap-4 shadow-lift">
        <span className="text-2xl" aria-hidden="true">📲</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install ScrollGuard</p>
          <p className="truncate text-xs text-ink-soft">Get the app on your home screen with offline support.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button className="btn-ghost px-3" onClick={() => setVisible(false)} aria-label="Dismiss install prompt">
            Not now
          </button>
          <Button variant="primary" onClick={install} className="px-4 py-2">
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}