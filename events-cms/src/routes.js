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
  AddCategory: React.lazy(() => import('./Pages/Events/categories/AddCategoryPage.jsx')),
  ViewCategory: React.lazy(() => import('./Pages/Events/categories/ViewCategoryPage.jsx')),
  EditCategory: React.lazy(() => import('./Pages/Events/categories/AddCategoryPage.jsx')),

  AddEvent: React.lazy(() => import('./Pages/Events/all-events/components/AddEventPage.jsx')),
  ViewEvent: React.lazy(() => import('./Pages/Events/all-events/components/ViewEventPage.jsx')),
  AddRegisterEvent: React.lazy(() => import('./Pages/Events/registered-events/AddRegisterEventPage.jsx')),
  ViewRegisterEvent: React.lazy(() => import('./Pages/Events/registered-events/ViewRegisterEventPage.jsx')),
};

const MediaManagerComponents = {
  Gallery: React.lazy(() => import('./Pages/MediaManager/Gallery/GalleryPage.jsx')),
  BannerManagement: React.lazy(() => import('./Pages/MediaManager/Banner/BannerManagement.jsx'))
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
  AddUser: React.lazy(() => import('./Pages/Users/AddUserPage.jsx')),
  ViewUser: React.lazy(() => import('./Pages/Users/ViewUserPage.jsx')),
  EditUser: React.lazy(() => import('./Pages/Users/AddUserPage.jsx')),

};

const speakerComponents = {
  List: React.lazy(() => import('./Pages/Speakers/Speakers.jsx')),
  AddSpeaker: React.lazy(() => import('./Pages/Speakers/AddSpeakerPage.jsx')),
  ViewSpeaker: React.lazy(() => import('./Pages/Speakers/ViewSpeakerPage.jsx'))
};

/**
 * Settings related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const settingsComponents = {
  TermsAndConditions: React.lazy(() => import('./Pages/Settings/TC/TermCondition.jsx')),
  PrivacyPolicy: React.lazy(() => import('./Pages/Settings/Privacy/PrivacyPolicy.jsx')),
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
    path: '/users/add-user',
    exact: true,
    name: 'Add User',
    component: userComponents.AddUser
  },
  {
    path: '/users/edit-user/:id',
    exact: true,
    name: 'Edit User',
    component: userComponents.AddUser
  },
  {
    path: '/users/view-user/:id',
    exact: true,
    name: 'View User',
    component: userComponents.ViewUser
  }
];

const speakerRoutes = [
  {
    path: '/speakers',
    exact: true,
    name: 'Speakers List',
    component: speakerComponents.List
  },
  {
    path: '/speakers/add-speaker',
    exact: true,
    name: 'Add Speaker',
    component: speakerComponents.AddSpeaker
  },
  {
    path: '/speakers/edit-speaker/:id',
    exact: true,
    name: 'Edit Speaker',
    component: speakerComponents.AddSpeaker
  },
  {
    path: '/speakers/view-speaker/:id',
    exact: true,
    name: 'View Speaker',
    component: speakerComponents.ViewSpeaker
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
    path: '/events/add-event',
    exact: true,
    name: 'Add Event',
    component: eventComponents.AddEvent
  },
  {
    path: '/events/edit-event/:id',
    exact: true,
    name: 'Edit Event',
    component: eventComponents.AddEvent
  },
  {
    path: '/events/view-event/:id',
    exact: true,
    name: 'View Event',
    component: eventComponents.ViewEvent
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
    path: '/events/add-register-event',
    exact: true,
    name: 'Add Register Event',
    component: eventComponents.AddRegisterEvent
  },
  {
    path: '/events/view-register-event/:id',
    exact: true,
    name: 'View Register Event',
    component: eventComponents.ViewRegisterEvent
  },

  {
    path: '/categories',
    exact: true,
    name: 'Categories List',
    component: eventComponents.Categories
  },
  {
    path: '/events/add-category',
    exact: true,
    name: 'Add Category',
    component: eventComponents.AddCategory
  },
  {
    path: '/events/edit-category/:id',
    exact: true,
    name: 'Edit Category',
    component: eventComponents.AddCategory
  },
  {
    path: '/events/view-category/:id',
    exact: true,
    name: 'View Category',
    component: eventComponents.ViewCategory
  },

];

const MediaManagerRoutes = [
  {
    path: '/media-manager/gallery',
    exact: true,
    name: 'Gallery',
    component: MediaManagerComponents.Gallery
  },
  {
    path: '/media-manager/banner-management',
    exact: true,
    name: 'Banner Management',
    component: MediaManagerComponents.BannerManagement
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
  ...MediaManagerRoutes,
  ...speakerRoutes,
  ...settingsRoutes,
  ...transactionRoutes,
  ...demoRoutes
];

export default routes;
