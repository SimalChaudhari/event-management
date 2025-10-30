import * as React from 'react';
import {
    DASHBOARD_PATHS,
    EVENT_PATHS,
    EXHIBITOR_PATHS,
    MEDIA_MANAGER_PATHS,
    SETTINGS_PATHS,
    SPEAKER_PATHS,
    SURVEY_PATHS,
    TRANSACTION_PATHS,
    USER_PATHS,
    POLLING_PATHS,
    LOGS_PATHS,
    PROGRAMME_PATHS,
    ENGAGEMENT_PATHS
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
    ViewRegisterEvent: React.lazy(() => import('./Pages/Events/registered-events/ViewRegisterEventPage.jsx')),

    Gallery: React.lazy(() => import('./Pages/Events/gallery/GalleryPage.jsx')),
    AddGallery: React.lazy(() => import('./Pages/Events/gallery/AddGalleryPage.jsx')),
    EditGallery: React.lazy(() => import('./Pages/Events/gallery/AddGalleryPage.jsx')),
    ViewGallery: React.lazy(() => import('./Pages/Events/gallery/ViewGalleryPage.jsx')),
    
    // Q&A
    QA: React.lazy(() => import('./Pages/Events/qa/QAPage.jsx')),
    ViewQuestion: React.lazy(() => import('./Pages/Events/qa/ViewQuestionPage.jsx')),
};

const MediaManagerComponents = {
    BannerManagement: React.lazy(() => import('./Pages/MediaManager/Banner/BannerManagement.jsx')),
    LogoManagement: React.lazy(() => import('./Pages/Settings/Logo/LogoManagement.jsx'))
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

const exhibitorComponents = {
    List: React.lazy(() => import('./Pages/Exhibitors/Exhibitors.jsx')),
    AddExhibitor: React.lazy(() => import('./Pages/Exhibitors/AddExhibitorPage.jsx')),
    ViewExhibitor: React.lazy(() => import('./Pages/Exhibitors/ViewExhibitorPage.jsx')),
    
    // Promotional Offers components
    PromotionalOffers: React.lazy(() => import('./Pages/Exhibitors/PromotionalOffers/PromotionalOffersPage.jsx')),
    AddPromotionalOffer: React.lazy(() => import('./Pages/Exhibitors/PromotionalOffers/AddPromotionalOfferPage.jsx')),
    ViewPromotionalOffer: React.lazy(() => import('./Pages/Exhibitors/PromotionalOffers/ViewPromotionalOfferPage.jsx'))
};

/**
 * Survey related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const surveyComponents = {
    List: React.lazy(() => import('./Pages/Surveys/SurveyView.jsx')),
    AddSurvey: React.lazy(() => import('./Pages/Surveys/AddSurveyPage.jsx')),
    ViewSurvey: React.lazy(() => import('./Pages/Surveys/ViewSurveyPage.jsx'))
};

/**
 * Polling related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const pollingComponents = {
    List: React.lazy(() => import('./Pages/Polling/PollsView.jsx')),
    AddPoll: React.lazy(() => import('./Pages/Polling/AddPollPage.jsx')),
    ViewPoll: React.lazy(() => import('./Pages/Polling/ViewPollPage.jsx')),
    Results: React.lazy(() => import('./Pages/Polling/PollResultsPage.jsx'))
};

/**
 * Programme related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const programmeComponents = {
    List: React.lazy(() => import('./Pages/Programme/ProgrammeList.jsx')),
    AddTrack: React.lazy(() => import('./Pages/Programme/AddTrackPage.jsx')),
    ViewTrack: React.lazy(() => import('./Pages/Programme/ViewTrackPage.jsx')),
    TrackSessions: React.lazy(() => import('./Pages/Programme/TrackSessionsPage.jsx')),
    AddSession: React.lazy(() => import('./Pages/Programme/AddSessionPage.jsx')),
    ViewSession: React.lazy(() => import('./Pages/Programme/ViewSessionPage.jsx'))
};

/**
 * Engagement related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const engagementComponents = {
    List: React.lazy(() => import('./Pages/Engagement/EngagementList.jsx')),
    AddEngagement: React.lazy(() => import('./Pages/Engagement/AddEngagementPage.jsx')),
    ViewEngagement: React.lazy(() => import('./Pages/Engagement/ViewEngagementPage.jsx')),
    EngagementQA: React.lazy(() => import('./Pages/Engagement/EngagementQAPage.jsx')),
    ViewEngagementQuestion: React.lazy(() => import('./Pages/Engagement/ViewEngagementQuestionPage.jsx')),
    EngagementSessions: React.lazy(() => import('./Pages/Engagement/EngagementSessionsPage.jsx'))
};

/**
 * Moderator related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const moderatorComponents = {
    List: React.lazy(() => import('./Pages/Moderators/ModeratorList.jsx')),
    AddModerator: React.lazy(() => import('./Pages/Moderators/AddModeratorPage.jsx')),
    ViewModerator: React.lazy(() => import('./Pages/Moderators/ViewModeratorPage.jsx')),
    AssignEvents: React.lazy(() => import('./Pages/Moderators/AssignEventsPage.jsx')),
    Landing: React.lazy(() => import('./Pages/Moderators/ModeratorLandingPage.jsx')),
    QA: React.lazy(() => import('./Pages/Moderators/ModeratorQAPage.jsx'))
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
 * Logs related components
 * @type {Object.<string, React.LazyExoticComponent>}
 */
const logsComponents = {
    LogsPage: React.lazy(() => import('./Pages/Logs/LogsPage.jsx')),
    // LogDetailsPage: React.lazy(() => import('./Pages/Logs/LogDetailsPage.jsx'))
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

const exhibitorRoutes = [
    {
        path: EXHIBITOR_PATHS.LIST_EXHIBITORS,
        exact: true,
        name: 'Exhibitors List',
        component: exhibitorComponents.List
    },
    {
        path: EXHIBITOR_PATHS.ADD_EXHIBITOR,
        exact: true,
        name: 'Add Exhibitor',
        component: exhibitorComponents.AddExhibitor
    },
    {
        path: EXHIBITOR_PATHS.EDIT_EXHIBITOR + '/:id',
        exact: true,
        name: 'Edit Exhibitor',
        component: exhibitorComponents.AddExhibitor
    },
    {
        path: EXHIBITOR_PATHS.VIEW_EXHIBITOR + '/:id',
        exact: true,
        name: 'View Exhibitor',
        component: exhibitorComponents.ViewExhibitor
    },
    
    // Promotional Offers routes
    {
        path: EXHIBITOR_PATHS.PROMOTIONAL_OFFERS,
        exact: true,
        name: 'Promotional Offers',
        component: exhibitorComponents.PromotionalOffers
    },
    {
        path: EXHIBITOR_PATHS.ADD_PROMOTIONAL_OFFER,
        exact: true,
        name: 'Add Promotional Offer',
        component: exhibitorComponents.AddPromotionalOffer
    },
    {
        path: EXHIBITOR_PATHS.EDIT_PROMOTIONAL_OFFER + '/:id',
        exact: true,
        name: 'Edit Promotional Offer',
        component: exhibitorComponents.AddPromotionalOffer
    },
    {
        path: EXHIBITOR_PATHS.VIEW_PROMOTIONAL_OFFER + '/:id',
        exact: true,
        name: 'View Promotional Offer',
        component: exhibitorComponents.ViewPromotionalOffer
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

    // Gallery

    {
        path: EVENT_PATHS.GALLERY,
        exact: true,
        name: 'Gallery',
        component: eventComponents.Gallery
    },
    {
        path: EVENT_PATHS.ADD_GALLERY,
        exact: true,
        name: 'Add Gallery',
        component: eventComponents.AddGallery
    },
    {
        path: EVENT_PATHS.EDIT_GALLERY,
        exact: true,
        name: 'Edit Gallery',
        component: eventComponents.EditGallery
    },
    {
        path: EVENT_PATHS.VIEW_GALLERY + '/:id',
        exact: true,
        name: 'View Gallery',
        component: eventComponents.ViewGallery
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
    },
    
    // Q&A
    {
        path: EVENT_PATHS.QA + '/:eventId',
        exact: true,
        name: 'Q&A Management',
        component: eventComponents.QA
    },
    {
        path: EVENT_PATHS.QA + '/:eventId/view/:questionId',
        exact: true,
        name: 'View Question',
        component: eventComponents.ViewQuestion
    }
];

const MediaManagerRoutes = [
    {
        path: MEDIA_MANAGER_PATHS.GALLERY,
        exact: true,
        name: 'Gallery',
        component: eventComponents.Gallery
    },
    {
        path: MEDIA_MANAGER_PATHS.BANNER_MANAGEMENT,
        exact: true,
        name: 'Banner Management',
        component: MediaManagerComponents.BannerManagement
    },
    {
        path: MEDIA_MANAGER_PATHS.LOGO_MANAGEMENT,
        exact: true,
        name: 'Logo Management',
        component: MediaManagerComponents.LogoManagement
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
 * Logs routes configuration
 * @type {RouteConfig[]}
 */
const logsRoutes = [
    {
        path: LOGS_PATHS.LIST_LOGS,
        exact: true,
        name: 'System Logs',
        component: logsComponents.LogsPage
    },
    {
        path: LOGS_PATHS.LOG_DETAILS,
        exact: true,
        name: 'Log Details',
        component: logsComponents.LogDetailsPage
    }
];

/**
 * Survey routes configuration
 * @type {RouteConfig[]}
 */
const surveyRoutes = [
    {
        path: SURVEY_PATHS.LIST_SURVEYS,
        exact: true,
        name: 'Surveys List',
        component: surveyComponents.List
    },
    {
        path: SURVEY_PATHS.ADD_SURVEY,
        exact: true,
        name: 'Add Survey',
        component: surveyComponents.AddSurvey
    },
    {
        path: SURVEY_PATHS.EDIT_SURVEY + '/:id',
        exact: true,
        name: 'Edit Survey',
        component: surveyComponents.AddSurvey
    },
    {
        path: SURVEY_PATHS.VIEW_SURVEY + '/:id',
        exact: true,
        name: 'View Survey',
        component: surveyComponents.ViewSurvey
    }
];

/**
 * Polling routes configuration
 * @type {RouteConfig[]}
 */
const pollingRoutes = [
    {
        path: POLLING_PATHS.LIST_POLLS,
        exact: true,
        name: 'Polls List',
        component: pollingComponents.List
    },
    {
        path: POLLING_PATHS.ADD_POLL,
        exact: true,
        name: 'Add Poll',
        component: pollingComponents.AddPoll
    },
    {
        path: POLLING_PATHS.EDIT_POLL + '/:id',
        exact: true,
        name: 'Edit Poll',
        component: pollingComponents.AddPoll
    },
    {
        path: POLLING_PATHS.VIEW_POLL + '/:id',
        exact: true,
        name: 'View Poll',
        component: pollingComponents.ViewPoll
    },
    {
        path: POLLING_PATHS.POLL_RESULTS + '/:eventId',
        exact: true,
        name: 'Poll Results',
        component: pollingComponents.Results
    }
];

/**
 * Programme routes configuration
 * @type {RouteConfig[]}
 */
const programmeRoutes = [
    {
        path: PROGRAMME_PATHS.LIST_PROGRAMMES,
        exact: true,
        name: 'Programme Management',
        component: programmeComponents.List
    },
    // Track routes
    {
        path: PROGRAMME_PATHS.ADD_TRACK,
        exact: true,
        name: 'Add Track',
        component: programmeComponents.AddTrack
    },
    {
        path: PROGRAMME_PATHS.EDIT_TRACK + '/:id',
        exact: true,
        name: 'Edit Track',
        component: programmeComponents.AddTrack
    },
    {
        path: PROGRAMME_PATHS.VIEW_TRACK + '/:id',
        exact: true,
        name: 'View Track',
        component: programmeComponents.ViewTrack
    },
    {
        path: PROGRAMME_PATHS.TRACK_SESSIONS + '/:trackId',
        exact: true,
        name: 'Track Sessions',
        component: programmeComponents.TrackSessions
    },
    // Session routes
    {
        path: PROGRAMME_PATHS.ADD_SESSION,
        exact: true,
        name: 'Add Session',
        component: programmeComponents.AddSession
    },
    {
        path: PROGRAMME_PATHS.EDIT_SESSION + '/:id',
        exact: true,
        name: 'Edit Session',
        component: programmeComponents.AddSession
    },
    {
        path: PROGRAMME_PATHS.VIEW_SESSION + '/:id',
        exact: true,
        name: 'View Session',
        component: programmeComponents.ViewSession
    }
];

/**
 * Engagement routes configuration
 * @type {RouteConfig[]}
 */
const engagementRoutes = [
    {
        path: ENGAGEMENT_PATHS.LIST_ENGAGEMENTS,
        exact: true,
        name: 'Engagement Management',
        component: engagementComponents.List
    },
    {
        path: ENGAGEMENT_PATHS.ADD_ENGAGEMENT,
        exact: true,
        name: 'Add Engagement',
        component: engagementComponents.AddEngagement
    },
    {
        path: ENGAGEMENT_PATHS.EDIT_ENGAGEMENT + '/:id',
        exact: true,
        name: 'Edit Engagement',
        component: engagementComponents.AddEngagement
    },
    {
        path: ENGAGEMENT_PATHS.VIEW_ENGAGEMENT + '/:id',
        exact: true,
        name: 'View Engagement',
        component: engagementComponents.ViewEngagement
    },
    {
        path: '/engagement/qa/:engagementId/view/:questionId',
        exact: true,
        name: 'View Engagement Question',
        component: engagementComponents.ViewEngagementQuestion
    },
    {
        path: '/engagement/qa/:engagementId',
        exact: true,
        name: 'Engagement Q&A',
        component: engagementComponents.EngagementQA
    },
    {
        path: ENGAGEMENT_PATHS.QA,
        exact: true,
        name: 'Engagement Q&A (Session Only)',
        component: engagementComponents.EngagementQA
    },
    {
        path: ENGAGEMENT_PATHS.SESSIONS + '/:trackId',
        exact: true,
        name: 'Engagement Sessions',
        component: engagementComponents.EngagementSessions
    }
];

/**
 * Moderator routes configuration
 * @type {RouteConfig[]}
 */
const moderatorRoutes = [
    {
        path: '/moderators',
        exact: true,
        name: 'Moderator Management',
        component: moderatorComponents.List
    },
    {
        path: '/moderators/add',
        exact: true,
        name: 'Add Moderator',
        component: moderatorComponents.AddModerator
    },
    {
        path: '/moderators/edit/:id',
        exact: true,
        name: 'Edit Moderator',
        component: moderatorComponents.AddModerator
    },
    {
        path: '/moderators/view/:id',
        exact: true,
        name: 'View Moderator',
        component: moderatorComponents.ViewModerator
    },
    {
        path: '/moderators/assign-events/:id',
        exact: true,
        name: 'Assign Events',
        component: moderatorComponents.AssignEvents
    }
];

/**
 * Public moderator routes (no login required)
 * @type {RouteConfig[]}
 */
const publicModeratorRoutes = [
    {
        path: '/moderator/:moderatorId',
        exact: true,
        name: 'Moderator Landing',
        component: moderatorComponents.Landing
    },
    {
        path: '/moderator/session/:sessionId',
        exact: true,
        name: 'Moderator Session Landing',
        component: moderatorComponents.Landing
    },
    {
        path: '/moderator/qa/:moderatorId/:eventId',
        exact: true,
        name: 'Moderator QA',
        component: moderatorComponents.QA
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
    ...exhibitorRoutes,
    ...speakerRoutes,
    ...surveyRoutes,
    ...pollingRoutes,
    ...programmeRoutes,
    ...engagementRoutes,
    ...moderatorRoutes,
    ...settingsRoutes,
    ...logsRoutes,
    ...transactionRoutes,
    ...demoRoutes
];

export default routes;
export { publicModeratorRoutes };
