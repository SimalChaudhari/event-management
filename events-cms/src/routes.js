import * as React from 'react';

/**
 * @typedef {Object} RouteConfig
 * @property {string} path - The URL path for the route
 * @property {boolean} exact - Whether the route should match exactly
 * @property {string} name - Display name of the route
 * @property {React.LazyExoticComponent} component - Lazy loaded component
 */

/**
 * Dashboard related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const dashboardComponents = {
  Default: React.lazy(() => import('./Demo/Dashboard/Default'))
};

/**
 * Event related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const eventComponents = {
  List: React.lazy(() => import('./Pages/Events/all-events/EventView.jsx')),
  Upcoming: React.lazy(() => import('./Pages/Events/upcoming-events/UpcomingEvents.jsx')),
  Registered: React.lazy(() => import('./Pages/Events/registered-events/RegisteredEvents.jsx'))
};

/**
 * Transaction related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const transactionComponents = {
  OrderList: React.lazy(() => import('./Pages/Orders/OrderView.jsx')),
  WithdrawalRequest: React.lazy(() => import('./Pages/Withrawal/WithrawalRequest.jsx'))
};

/**
 * User management components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const userComponents = {
  Profile: React.lazy(() => import('./Pages/Settings/Profile/Profile.jsx')),
  List: React.lazy(() => import('./Pages/Users/UserList.jsx'))
};

/**
 * Sample/Demo components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const demoComponents = {
  SamplePage: React.lazy(() => import('./Demo/Other/SamplePage'))
};

/**
 * Dashboard routes configuration
 * @type {RouteConfig[]}
 */
const dashboardRoutes = [
  {
    path: '/dashboard',
    exact: true,
    name: 'Dashboard',
    component: dashboardComponents.Default
  }
];

/**
 * User management routes configuration
 * @type {RouteConfig[]}
 */
const userRoutes = [
  {
    path: '/users',
    exact: true,
    name: 'Users List',
    component: userComponents.List
  },
  {
    path: '/profile',
    exact: true,
    name: 'Profile List',
    component: userComponents.Profile
  }
];

/**
 * Event management routes configuration
 * @type {RouteConfig[]}
 */
const eventRoutes = [
  {
    path: '/events/event-list',
    exact: true,
    name: 'Events List',
    component: eventComponents.List
  },
  {
    path: '/events/upcoming',
    exact: true,
    name: 'Upcoming Events',
    component: eventComponents.Upcoming
  },
  {
    path: '/events/registered',
    exact: true,
    name: 'Registered Events',
    component: eventComponents.Registered
  }
];

/**
 * Transaction routes configuration
 * @type {RouteConfig[]}
 */
const transactionRoutes = [
  {
    path: '/order',
    exact: true,
    name: 'Order List',
    component: transactionComponents.OrderList
  },
  {
    path: '/withdrawal',
    exact: true,
    name: 'Withdrawal List',
    component: transactionComponents.WithdrawalRequest
  }
];

/**
 * Sample/Demo routes configuration
 * @type {RouteConfig[]}
 */
const demoRoutes = [
  {
    path: '/sample-page',
    exact: true,
    name: 'Sample Page',
    component: demoComponents.SamplePage
  }
];

/**
 * Combined routes configuration
 * @type {RouteConfig[]}
 */
const routes = [
  ...dashboardRoutes,
  ...userRoutes,
  ...eventRoutes,
  ...transactionRoutes,
  ...demoRoutes
];

export default routes;
