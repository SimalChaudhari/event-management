/**
 * Route path constants – use these for Link to="/..." and programmatic navigation
 */
export const ROUTES = {
  HOME: '/',
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
