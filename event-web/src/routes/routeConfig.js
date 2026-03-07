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
  REWARDS: '/rewards',
  SCAN: '/scan',
  GALLERY: '/gallery',
  PROFILE: '/profile',
  EVENT_DETAIL: '/event/:id',
  MY_EVENTS: '/my-events',
  EVENTS_FEATURED: '/events/featured',
  EVENTS_UPCOMING: '/events/upcoming',
};

export const getEventDetailPath = (id) => `/event/${id}`;
