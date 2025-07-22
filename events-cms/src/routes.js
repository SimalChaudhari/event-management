import * as React from 'react';
import {
    DASHBOARD_PATHS,
    EVENT_PATHS,
    MEDIA_MANAGER_PATHS,
    SETTINGS_PATHS,
    SPEAKER_PATHS,
    TRANSACTION_PATHS,
    USER_PATHS
} from './utils/constants.js';

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
    EditRegisterEvent: React.lazy(() => import('./Pages/Events/registered-events/AddRegisterEventPage.jsx')),
    ViewRegisterEvent: React.lazy(() => import('./Pages/Events/registered-events/ViewRegisterEventPage.jsx'))
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
    EditUser: React.lazy(() => import('./Pages/Users/AddUserPage.jsx'))
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
    PrivacyPolicy: React.lazy(() => import('./Pages/Settings/Privacy/PrivacyPolicy.jsx'))
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
        path: DASHBOARD_PATHS.DEFAULT,
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
        path: USER_PATHS.LIST_USERS,
        exact: true,
        name: 'Users List',
        component: userComponents.List
    },
    {
        path: USER_PATHS.PROFILE,
        exact: true,
        name: 'Profile List',
        component: userComponents.Profile
    },
    {
        path: USER_PATHS.ADD_USER ,
        exact: true,
        name: 'Add User',
        component: userComponents.AddUser
    },
    {
        path: USER_PATHS.EDIT_USER + '/:id',
        exact: true,
        name: 'Edit User',
        component: userComponents.AddUser
    },
    {
        path: USER_PATHS.VIEW_USER + '/:id',
        exact: true,
        name: 'View User',
        component: userComponents.ViewUser
    }
];

const speakerRoutes = [
    {
        path: SPEAKER_PATHS.LIST_SPEAKERS,
        exact: true,
        name: 'Speakers List',
        component: speakerComponents.List
    },
    {
        path: SPEAKER_PATHS.ADD_SPEAKER,
        exact: true,
        name: 'Add Speaker',
        component: speakerComponents.AddSpeaker
    },
    {
        path: SPEAKER_PATHS.EDIT_SPEAKER + '/:id',
        exact: true,
        name: 'Edit Speaker',
        component: speakerComponents.AddSpeaker
    },
    {
        path: SPEAKER_PATHS.VIEW_SPEAKER + '/:id',
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
    // List Events
    {
        path: EVENT_PATHS.LIST_EVENTS,
        exact: true,
        name: 'Events List',
        component: eventComponents.List
    },
    {
        path: EVENT_PATHS.ADD_EVENT,
        exact: true,
        name: 'Add Event',
        component: eventComponents.AddEvent
    },
    {
        path: EVENT_PATHS.EDIT_EVENT + '/:id',
        exact: true,
        name: 'Edit Event',
        component: eventComponents.AddEvent
    },
    {
        path: EVENT_PATHS.VIEW_EVENT + '/:id',
        exact: true,
        name: 'View Event',
        component: eventComponents.ViewEvent
    },

    // Upcoming Events
    {
        path: EVENT_PATHS.UPCOMING_EVENTS,
        exact: true,
        name: 'Upcoming Events',
        component: eventComponents.Upcoming
    },

    // Registered Events
    {
        path: EVENT_PATHS.REGISTERED_EVENTS,
        exact: true,
        name: 'Registered Events',
        component: eventComponents.Registered
    },
    {
        path: EVENT_PATHS.ADD_REGISTER_EVENT,
        exact: true,
        name: 'Add Register Event',
        component: eventComponents.AddRegisterEvent
    },

    {
        path: EVENT_PATHS.EDIT_REGISTER_EVENT + '/:id',
        exact: true,
        name: 'Edit Register Event',
        component: eventComponents.AddRegisterEvent
    },
    {
        path: EVENT_PATHS.VIEW_REGISTER_EVENT + '/:id',
        exact: true,
        name: 'View Register Event',
        component: eventComponents.ViewRegisterEvent
    },

    // Categories
    {
        path: EVENT_PATHS.CATEGORIES,
        exact: true,
        name: 'Categories List',
        component: eventComponents.Categories
    },
    {
        path: EVENT_PATHS.ADD_CATEGORY,
        exact: true,
        name: 'Add Category',
        component: eventComponents.AddCategory
    },
    {
        path: EVENT_PATHS.EDIT_CATEGORY + '/:id',
        exact: true,
        name: 'Edit Category',
        component: eventComponents.AddCategory
    },
    {
        path: EVENT_PATHS.VIEW_CATEGORY + '/:id',
        exact: true,
        name: 'View Category',
        component: eventComponents.ViewCategory
    }
];

const MediaManagerRoutes = [
    {
        path: MEDIA_MANAGER_PATHS.GALLERY,
        exact: true,
        name: 'Gallery',
        component: MediaManagerComponents.Gallery
    },
    {
        path: MEDIA_MANAGER_PATHS.BANNER_MANAGEMENT,
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
        path: TRANSACTION_PATHS.ORDER_LIST,
        exact: true,
        name: 'Order List',
        component: transactionComponents.OrderList
    },
    {
        path: TRANSACTION_PATHS.WITHDRAWAL_REQUEST,
        exact: true,
        name: 'Withdrawal List',
        component: transactionComponents.WithdrawalRequest
    },
    {
        path: TRANSACTION_PATHS.REPORTS,
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
        path: SETTINGS_PATHS.TERMS_AND_CONDITIONS,
        exact: true,
        name: 'Terms and Conditions',
        component: settingsComponents.TermsAndConditions
    },
    {
        path: SETTINGS_PATHS.PRIVACY_POLICY,
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
