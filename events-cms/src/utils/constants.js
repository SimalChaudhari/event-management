// Auth Paths
export const AUTH_PATHS = {
    SIGNIN: '/auth/signin',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password'
};

// Dashboard Paths
export const DASHBOARD_PATHS = {
    DEFAULT: '/'
};

export const USER_PATHS = {
    LIST_USERS: '/users',
    ADD_USER: '/users/add-user',
    EDIT_USER: '/users/edit-user',
    VIEW_USER: '/users/view-user',
    // Profile
    PROFILE: '/profile'
};

export const SPEAKER_PATHS = {
    LIST_SPEAKERS: '/speakers',
    ADD_SPEAKER: '/speakers/add-speaker',
    EDIT_SPEAKER: '/speakers/edit-speaker',
    VIEW_SPEAKER: '/speakers/view-speaker'
};

export const EXHIBITOR_PATHS = {
    LIST_EXHIBITORS: '/exhibitors',
    ADD_EXHIBITOR: '/exhibitors/add-exhibitor',
    EDIT_EXHIBITOR: '/exhibitors/edit-exhibitor',
    VIEW_EXHIBITOR: '/exhibitors/view-exhibitor',
    
    // Promotional Offers paths (Event Gallery जैसा pattern)
    PROMOTIONAL_OFFERS: '/exhibitors/promotional-offers',
    ADD_PROMOTIONAL_OFFER: '/exhibitors/promotional-offers/add',
    EDIT_PROMOTIONAL_OFFER: '/exhibitors/promotional-offers/edit',
    VIEW_PROMOTIONAL_OFFER: '/exhibitors/promotional-offers/view',
};

export const EVENT_PATHS = {
    // Events
    LIST_EVENTS: '/events',
    ADD_EVENT: '/events/add-event',
    EDIT_EVENT: '/events/edit-event',
    VIEW_EVENT: '/events/view-event',

    // Upcoming Events
    UPCOMING_EVENTS: '/upcoming',
    ADD_UPCOMING_EVENT: '/upcoming/add-upcoming-event',
    EDIT_UPCOMING_EVENT: '/upcoming/edit-upcoming-event',
    VIEW_UPCOMING_EVENT: '/upcoming/view-upcoming-event',

    // Registered Events
    REGISTERED_EVENTS: '/registered',
    ADD_REGISTER_EVENT: '/registered/add-register-event',
    EDIT_REGISTER_EVENT: '/registered/edit-register-event',
    VIEW_REGISTER_EVENT: '/registered/view-register-event',

    // Categories
    CATEGORIES: '/categories',
    ADD_CATEGORY: '/events/add-category',
    EDIT_CATEGORY: '/events/edit-category',
    VIEW_CATEGORY: '/events/view-category',

    //gallery

    GALLERY: '/events/gallery',
    ADD_GALLERY: '/events/gallery/add',
    EDIT_GALLERY: '/events/gallery/edit',
    VIEW_GALLERY: '/events/gallery/view',

    // Q&A
    QA: '/events/qa',

    // Attendance Tracking
    ATTENDANCE: '/events/attendance/:eventId',

    // Public facing pages
    PUBLIC_EVENT_QR: '/events/participants-qr/:eventId',
};  

export const MEDIA_MANAGER_PATHS = {
    GALLERY: '/media-manager/gallery',
    BANNER_MANAGEMENT: '/media-manager/banner-management',
    LOGO_MANAGEMENT: '/media-manager/logo-management'
};

export const SETTINGS_PATHS = {
    TERMS_AND_CONDITIONS: '/settings/terms-conditions',
    PRIVACY_POLICY: '/settings/privacy-policy',
    EMAIL_TEMPLATES: '/settings/email-templates',
    ADD_EMAIL_TEMPLATE: '/settings/email-templates/add',
    EDIT_EMAIL_TEMPLATE: '/settings/email-templates/edit/:id',
    VIEW_EMAIL_TEMPLATE: '/settings/email-templates/view/:id',
    CHOOSE_EMAIL_TEMPLATE: '/settings/email-templates/choose-template'
};

export const TRANSACTION_PATHS = {
    ORDER_LIST: '/order',
    WITHDRAWAL_REQUEST: '/withrawal',
    REPORTS: '/reports'
};

export const SURVEY_PATHS = {
    LIST_SURVEYS: '/surveys',
    ADD_SURVEY: '/surveys/add',
    EDIT_SURVEY: '/surveys/edit',
    VIEW_SURVEY: '/surveys/view'
};

export const POLLING_PATHS = {
    LIST_POLLS: '/polls',
    ADD_POLL: '/polls/add',
    EDIT_POLL: '/polls/edit',
    VIEW_POLL: '/polls/view',
    POLL_RESULTS: '/polls/results'
};

export const PROGRAMME_PATHS = {
    LIST_PROGRAMMES: '/programme',
    
    // Track paths
    ADD_TRACK: '/programme/add-track',
    EDIT_TRACK: '/programme/edit-track',
    VIEW_TRACK: '/programme/view-track',
    TRACK_SESSIONS: '/programme/track-sessions',
    
    // Session paths  
    ADD_SESSION: '/programme/add-session',
    EDIT_SESSION: '/programme/edit-session',
    VIEW_SESSION: '/programme/view-session',
    
    LIST: '/programme'
};

export const ENGAGEMENT_PATHS = {
    LIST_ENGAGEMENTS: '/engagements',
    ADD_ENGAGEMENT: '/engagements/add',
    EDIT_ENGAGEMENT: '/engagements/edit',
    VIEW_ENGAGEMENT: '/engagements/view',
    
    // Q&A paths
    QA: '/engagement/qa',
    VIEW_QA_QUESTION: '/engagement/qa/:engagementId/view/:questionId',

    // Engagement Sessions
    SESSIONS: '/engagements/sessions',
    VIEW_SESSION: '/engagements/view-session'
};

export const LOGS_PATHS = {
    LIST_LOGS: '/logs',
    LOG_DETAILS: '/logs/:sessionId'
};

export const PUSH_NOTIFICATION_PATHS = {
    LIST_NOTIFICATIONS: '/push-notifications',
    ADD_NOTIFICATION: '/push-notifications/add',
    EDIT_NOTIFICATION: '/push-notifications/edit',
    VIEW_NOTIFICATION: '/push-notifications/view'
};

