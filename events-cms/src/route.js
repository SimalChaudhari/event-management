import * as React from 'react';
import { AUTH_PATHS } from './utils/constants';

/**
 * @typedef {Object} RouteConfig
 * @property {string} path - The URL path for the route
 * @property {boolean} exact - Whether the route should match exactly
 * @property {string} name - Display name of the route
 * @property {React.LazyExoticComponent} component - Lazy loaded component
 */

/**
 * Authentication related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const authComponents = {
  Signin: React.lazy(() => import('./Pages/Authentication/SignIn/SignIn')),
  ResetPassword: React.lazy(() => import('./Pages/Authentication/ResetPassword/ResetPassword')),

  ChangePassword: React.lazy(() => import('./Pages/Authentication/ChangePassword'))
};

/**
 * Maintenance related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const maintenanceComponents = {
  Error: React.lazy(() => import('./Demo/Maintenance/Error')),
  OfflineUI: React.lazy(() => import('./Demo/Maintenance/OfflineUI')),
  ComingSoon: React.lazy(() => import('./Demo/Maintenance/ComingSoon'))
};

/**
 * Authentication routes configuration
 * @type {RouteConfig[]}
 */
const authRoutes = [
  {
    path: AUTH_PATHS.SIGNIN,
    exact: true,
    name: 'Signin',
    component: authComponents.Signin
  },

  {
    path: AUTH_PATHS.RESET_PASSWORD,
    exact: true,
    name: 'Reset Password',
    component: authComponents.ResetPassword
  },
  {
    path: AUTH_PATHS.CHANGE_PASSWORD,
    exact: true,
    name: 'Change Password',
    component: authComponents.ChangePassword
  }
];

/**
 * Maintenance routes configuration
 * @type {RouteConfig[]}
 */
const maintenanceRoutes = [
  {
    path: '/maintenance/error',
    exact: true,
    name: 'Error',
    component: maintenanceComponents.Error
  },
  {
    path: '/maintenance/coming-soon',
    exact: true,
    name: 'Coming Soon',
    component: maintenanceComponents.ComingSoon
  },
  {
    path: '/maintenance/offline-ui',
    exact: true,
    name: 'Offline UI',
    component: maintenanceComponents.OfflineUI
  }
];

/**
 * Combined routes configuration
 * @type {RouteConfig[]}
 */
const routes = [...authRoutes, ...maintenanceRoutes];

export default routes;
