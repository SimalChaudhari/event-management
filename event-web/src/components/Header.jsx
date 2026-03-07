import { Link, NavLink } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';

const navItems = [
  { path: ROUTES.HOME, label: 'Home' },
  { path: ROUTES.REWARDS, label: 'Rewards' },
  { path: ROUTES.SCAN, label: 'Scan QR' },
  { path: ROUTES.GALLERY, label: 'Gallery' },
  { path: ROUTES.PROFILE, label: 'Profile' },
];

export default function Header() {
  return (
    <header className="w-full bg-white md:bg-[#71C0BB] border-b border-slate-200 md:border-[#71C0BB] sticky top-0 z-10">
      <div className="h-14 px-4 flex items-center justify-between max-w-app mx-auto md:max-w-[1200px] md:px-6">
      <button type="button" className="w-10 h-10 flex items-center justify-center text-slate-800 rounded-lg active:bg-slate-100" aria-label="Search">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
      <Link to={ROUTES.HOME} className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary-light" />
        <span className="text-xl font-bold tracking-wide text-slate-800">EVENTIAL</span>
      </Link>
      <nav className="hidden md:flex items-center gap-2 ml-8" aria-label="Main">
        {navItems.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `px-3.5 py-2 text-[15px] font-medium rounded-lg transition-colors ${
                isActive ? 'bg-white text-black' : 'text-black hover:bg-white/20'
              }`
            }
            end={path === ROUTES.HOME}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-1">
        <button type="button" className="w-10 h-10 flex items-center justify-center text-slate-800 rounded-lg" aria-label="Favorites">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <button type="button" className="relative w-10 h-10 flex items-center justify-center text-slate-800 rounded-lg" aria-label="Cart">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] font-semibold text-white bg-primary rounded-full">0</span>
        </button>
      </div>
    </div>
    </header>
  );
}
