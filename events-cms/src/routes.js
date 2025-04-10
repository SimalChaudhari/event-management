import * as React from 'react';
const DashboardDefault = React.lazy(() => import('./Demo/Dashboard/Default'));
const EventsList = React.lazy(() => import('./Pages/Events/all-events/EventView.jsx'));
const UpcomingEvents = React.lazy(() => import('./Pages/Events/upcoming-events/UpcomingEvents.jsx'));
const RegisteredEvents = React.lazy(() => import('./Pages/Events/registered-events/RegisteredEvents.jsx'));
const ExhibitorList = React.lazy(() => import('./Pages/Exhibitor/ExhibitorView.jsx'));
const ContentList = React.lazy(() => import('./Pages/Content/ContentView.js'));
const NotificationList = React.lazy(() => import('./Pages/Notification/NotificationView.js'));
const RewardsList = React.lazy(() => import('./Pages/Reports/Rewards/RewardsView.js'));
const AnalyticsList = React.lazy(() => import('./Pages/Reports/Analytics/AnalyticsView.js'));
const TourismList = React.lazy(() => import('./Pages/Settings/Tourism/TourismView.js'));
const ProfileList = React.lazy(() => import('./Pages/Settings/Profile/Profile.js'));
const UsersList = React.lazy(() => import('./Pages/Users/UserList.jsx'));





const OtherSamplePage = React.lazy(() => import('./Demo/Other/SamplePage'));
const routes = [
    { path: '/dashboard', exact: true, name: 'Analytics', component: DashboardDefault },
    { path: '/users', exact: true, name: 'Users List', component: UsersList },
    { path: '/events/event-list', exact: true, name: 'Events List', component: EventsList },
    { path: '/events/upcoming', exact: true, name: 'Upcoming Events', component: UpcomingEvents },
    { path: '/events/registered', exact: true, name: 'Registered Events', component: RegisteredEvents },
    { path: '/exhibitor', exact: true, name: 'Exhibitor List', component: ExhibitorList },
    { path: '/content', exact: true, name: 'Content List', component: ContentList },
    { path: '/notification', exact: true, name: 'Notification List', component: NotificationList },
    { path: '/rewards', exact: true, name: 'Rewards List', component: RewardsList },
    { path: '/analytics', exact: true, name: 'Analytics List', component: AnalyticsList },
    { path: '/tourism', exact: true, name: 'Tourism List', component: TourismList },
    { path: '/profile', exact: true, name: 'Profile List', component: ProfileList },

    // sanple page
    { path: '/sample-page', exact: true, name: 'Sample Page', component: OtherSamplePage }
];
export default routes;
