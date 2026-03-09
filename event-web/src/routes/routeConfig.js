/**
 * Route path constants – use these for Link to="/..." and programmatic navigation
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ENGAGEMENT: '/engagement',
  SCAN: '/scan',
  PROFILE: '/profile',
  EVENT_DETAIL: '/event/:id',
  MY_EVENTS: '/my-events',
  EVENTS_FEATURED: '/events/featured',
  EVENTS_UPCOMING: '/events/upcoming',
};

/** Title + subtitle for the shared gradient hero on layout pages. null = page provides custom hero via usePageHero. */
export const LAYOUT_HERO = {
  [ROUTES.SCAN]: { title: 'Scan QR', subtitle: 'Your personal QR code and event scanning' },
  [ROUTES.ENGAGEMENT]: { title: 'Engagement', subtitle: 'Q&A, polling and surveys for your events' },
  [ROUTES.PROFILE]: { title: 'My Profile', subtitle: 'Manage your account and event details' },
};

/** Breadcrumb trail for each path. Each item: { path, label }. Used for all pages. */
const BREADCRUMB_BY_PATH = {
  [ROUTES.HOME]: [{ path: '/', label: 'Home' }],
  [ROUTES.LOGIN]: [{ path: '/', label: 'Home' }, { path: '/login', label: 'Login' }],
  [ROUTES.REGISTER]: [{ path: '/', label: 'Home' }, { path: '/register', label: 'Register' }],
  [ROUTES.FORGOT_PASSWORD]: [{ path: '/', label: 'Home' }, { path: '/forgot-password', label: 'Forgot password' }],
  [ROUTES.RESET_PASSWORD]: [{ path: '/', label: 'Home' }, { path: '/reset-password', label: 'Reset password' }],
  [ROUTES.VERIFY_EMAIL]: [{ path: '/', label: 'Home' }, { path: '/verify-email', label: 'Verify email' }],
  [ROUTES.SCAN]: [{ path: '/', label: 'Home' }, { path: '/scan', label: 'Scan QR' }],
  [ROUTES.ENGAGEMENT]: [{ path: '/', label: 'Home' }, { path: '/engagement', label: 'Engagement' }],
  [ROUTES.PROFILE]: [{ path: '/', label: 'Home' }, { path: '/profile', label: 'My Profile' }],
};

export function getBreadcrumbs(pathname) {
  if (BREADCRUMB_BY_PATH[pathname]) {
    return BREADCRUMB_BY_PATH[pathname];
  }
  if (pathname.startsWith('/event/')) {
    return [{ path: '/', label: 'Home' }, { path: pathname, label: 'Event details' }];
  }
  return [{ path: '/', label: 'Home' }, { path: pathname, label: 'Page not found' }];
}

const SITE_NAME = 'Evential';

/** Document title per path for browser tab and SEO. */
const PAGE_TITLE_BY_PATH = {
  [ROUTES.HOME]: 'Home',
  [ROUTES.LOGIN]: 'Log in',
  [ROUTES.REGISTER]: 'Register',
  [ROUTES.FORGOT_PASSWORD]: 'Forgot password',
  [ROUTES.RESET_PASSWORD]: 'Reset password',
  [ROUTES.VERIFY_EMAIL]: 'Verify email',
  [ROUTES.SCAN]: 'Scan QR',
  [ROUTES.ENGAGEMENT]: 'Engagement',
  [ROUTES.PROFILE]: 'My Profile',
};

export function getPageTitle(pathname) {
  if (PAGE_TITLE_BY_PATH[pathname]) return PAGE_TITLE_BY_PATH[pathname];
  if (pathname.startsWith('/event/')) return 'Event details';
  if (pathname !== '/') return 'Page not found';
  return 'Home';
}

export function getDocumentTitle(pathname) {
  const pageTitle = getPageTitle(pathname);
  return pageTitle === 'Home' ? `${SITE_NAME} – Events` : `${pageTitle} – ${SITE_NAME}`;
}

export const getEventDetailPath = (id) => `/event/${id}`;
