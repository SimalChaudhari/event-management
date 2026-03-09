import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      <span className="text-8xl font-bold text-[#71C0BB]/20 select-none" aria-hidden>404</span>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mt-4">Page not found</h1>
      <p className="text-slate-600 mt-2 max-w-md">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link
        to={ROUTES.HOME}
        className="mt-8 px-6 py-3 text-sm font-medium text-white bg-[#71C0BB] rounded-lg hover:bg-[#5aa8a3] transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
