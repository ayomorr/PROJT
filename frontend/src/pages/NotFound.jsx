import { Link } from 'react-router-dom';
import { Button } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="max-w-sm text-center animate-fade-up">
        <p className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-6xl font-extrabold text-transparent">404</p>
        <h1 className="mt-4 text-xl font-extrabold text-ink">This page wandered off the feed.</h1>
        <p className="mt-2 text-sm text-ink-soft">The page you're looking for doesn't exist or was moved.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/app"><Button variant="primary">Go to dashboard</Button></Link>
          <Link to="/"><Button variant="secondary">Back home</Button></Link>
        </div>
      </div>
    </div>
  );
}