import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ROUTES } from '../routes/routeConfig';
import { logout } from '../store/actions/authActions';
import logo from '../assets/logo.png';
import { API_URL } from '../config/env';

const navItems = [
  { path: ROUTES.HOME, label: 'Home' },
  { path: ROUTES.ENGAGEMENT, label: 'Engagement' },
  { path: ROUTES.SCAN, label: 'Scan QR' },
  { path: ROUTES.PROFILE, label: 'Profile' },
];

function getProfilePictureUrl(user) {
  const raw = user?.profilePicture || user?.profileImage;
  if (!raw) return null;
  if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://'))) return raw;
  const base = API_URL || '';
  const path = raw.replace(/^\//, '');
  return base ? `${base}/${path}` : `/${path}`;
}

function getInitials(firstName, lastName, email) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { authenticated, authUser } = useSelector((s) => s.auth);
  const initials = getInitials(authUser?.firstName, authUser?.lastName, authUser?.email);
  const displayName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(' ') || authUser?.email || 'Profile';

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="w-full bg-white md:bg-[#71C0BB] border-b border-slate-200 md:border-[#71C0BB] sticky top-0 z-10">
      <div className="h-14 px-4 flex items-center justify-between max-w-app mx-auto md:max-w-[1200px] md:px-6">
    
      <Link to={ROUTES.HOME} className="flex items-center gap-2">
        <img src={logo} alt="EVENTIAL" className="h-8 w-auto object-contain md:bg-white md:rounded-lg md:p-1 md:border md:border-slate-200" />
      </Link>
      {authenticated && (
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
      )}
      <div className="flex items-center gap-1">
        {authenticated ? (
          <>
            <Link
              to={ROUTES.PROFILE}
              className="hidden md:flex items-center relative group"
              aria-label="Profile"
            >
              <span className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-sm font-semibold text-slate-700 border border-slate-200 overflow-hidden shrink-0">
                {getProfilePictureUrl(authUser) ? (
                  <img
                    src={getProfilePictureUrl(authUser)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </span>
              <span className="absolute right-0 top-full mt-1 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <span className="block px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
                  <span className="block font-medium">{displayName}</span>
                  {authUser?.email && (
                    <span className="block text-white/80 text-xs truncate max-w-[200px]">{authUser.email}</span>
                  )}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center text-slate-800 rounded-lg hover:bg-white/20"
              aria-label="Log out"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <NavLink
              to={ROUTES.LOGIN}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#71C0BB] text-white md:bg-white md:text-black'
                    : 'bg-[#71C0BB] text-white md:bg-transparent md:text-slate-800 md:hover:bg-white/20'
                }`
              }
            >
              Log in
            </NavLink>
            <NavLink
              to={ROUTES.REGISTER}
              className={({ isActive }) =>
                `max-[329px]:hidden px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#71C0BB] text-white md:bg-white md:text-black'
                    : 'bg-[#71C0BB] text-white md:bg-transparent md:text-slate-800 md:hover:bg-white/20'
                }`
              }
            >
              Sign up
            </NavLink>
          </>
        )}
      </div>
    </div>
    </header>
  );
}
