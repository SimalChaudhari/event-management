import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../routes/routeConfig';

const navItems = [
  { path: ROUTES.HOME, label: 'Home', icon: 'home' },
  { path: ROUTES.REWARDS, label: 'Rewards', icon: 'rewards' },
  { path: ROUTES.SCAN, label: 'Scan QR', icon: 'scan' },
  { path: ROUTES.GALLERY, label: 'Gallery', icon: 'gallery' },
  { path: ROUTES.PROFILE, label: 'Profile', icon: 'profile' },
];

const navItemsGuest = navItems.filter(
  (item) => item.path !== ROUTES.SCAN && item.path !== ROUTES.PROFILE
);

function NavIcon({ name }) {
  if (name === 'home') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  if (name === 'rewards') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    );
  }
  if (name === 'scan') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="7" y1="12" x2="17" y2="12" />
      </svg>
    );
  }
  if (name === 'gallery') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  if (name === 'profile') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  return null;
}

export default function BottomNav() {
  const { authenticated } = useSelector((s) => s.auth);
  const items = authenticated ? navItems : navItemsGuest;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] flex items-center justify-around bg-white border-t border-slate-200 z-10 md:hidden">
      {items.map(({ path, label, icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-slate-500'
            }`
          }
          end={path === ROUTES.HOME}
        >
          <span className="inline-flex [&_svg]:text-current">
            <NavIcon name={icon} />
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
