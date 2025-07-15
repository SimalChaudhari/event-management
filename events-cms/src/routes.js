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
  Registered: React.lazy(() => import('./Pages/Events/registered-events/RegisteredEvents.jsx')),
  Categories: React.lazy(() => import('./Pages/Events/categories/Categories.jsx')),
};

/**
 * Transaction related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const transactionComponents = {
  OrderList: React.lazy(() => import('./Pages/Orders/OrderView.jsx')),
  WithdrawalRequest: React.lazy(() => import('./Pages/Withrawal/WithrawalRequest.jsx')),
  Reports: React.lazy(() => import('./Pages/Reports/Reports.jsx'))
};

/**
 * User management components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const userComponents = {
  Profile: React.lazy(() => import('./Pages/Settings/Profile/Profile.jsx')),
  List: React.lazy(() => import('./Pages/Users/UserList.jsx')),
  Speakers: React.lazy(() => import('./Pages/Speakers/Speakers.jsx'))
};

/**
 * Settings related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const settingsComponents = {
  TermsAndConditions: React.lazy(() => import('./Pages/Settings/TC/TermCondition.jsx')),
  PrivacyPolicy: React.lazy(() => import('./Pages/Settings/Privacy/PrivacyPolicy.jsx')),
  BannerManagement: React.lazy(() => import('./Pages/Settings/Banner/BannerManagement.jsx'))
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
    path: '/',
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
  },

  {
    path: '/speakers',
    exact: true,
    name: 'Speakers List',
    component: userComponents.Speakers
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
  },
  {
    path: '/categories',
    exact: true,
    name: 'Categories List',
    component: eventComponents.Categories
  },
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
    path: '/withrawal',
    exact: true,
    name: 'Withdrawal List',
    component: transactionComponents.WithdrawalRequest
  },
  {
    path: '/reports',
    exact: true,
    name: 'Reports',
    component: transactionComponents.Reports
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

const settingsRoutes = [
  {
    path: '/settings/terms-conditions',
    exact: true,
    name: 'Terms and Conditions',
    component: settingsComponents.TermsAndConditions
  },
  {
    path: '/settings/privacy-policy',
    exact: true,
    name: 'Privacy Policy',
    component: settingsComponents.PrivacyPolicy
  },
  {
    path: '/settings/banner-management',
    exact: true,
    name: 'Banner Management',
    component: settingsComponents.BannerManagement
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
  ...settingsRoutes,
  ...transactionRoutes,
  ...demoRoutes
];

export default routes;
