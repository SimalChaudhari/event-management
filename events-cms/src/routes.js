import * as React from 'react';
const DashboardDefault = React.lazy(() => import('./Demo/Dashboard/Default'));
const EventsList = React.lazy(() => import('./Pages/Events/all-events/EventView.jsx'));
const UpcomingEvents = React.lazy(() => import('./Pages/Events/upcoming-events/UpcomingEvents.jsx'));
const RegisteredEvents = React.lazy(() => import('./Pages/Events/registered-events/RegisteredEvents.jsx'));
const OrderList = React.lazy(() => import('./Pages/Orders/OrderView.jsx'));
const WithrawalRequest = React.lazy(() => import('./Pages/Withrawal/WithrawalRequest.jsx'));

const ProfileList = React.lazy(() => import('./Pages/Settings/Profile/Profile.jsx'));
const UsersList = React.lazy(() => import('./Pages/Users/UserList.jsx'));

const OtherSamplePage = React.lazy(() => import('./Demo/Other/SamplePage'));
const routes = [
    { path: '/dashboard', exact: true, name: 'Dashboard', component: DashboardDefault },
    { path: '/users', exact: true, name: 'Users List', component: UsersList },
    { path: '/events/event-list', exact: true, name: 'Events List', component: EventsList },
    { path: '/events/upcoming', exact: true, name: 'Upcoming Events', component: UpcomingEvents },
    { path: '/events/registered', exact: true, name: 'Registered Events', component: RegisteredEvents },
    { path: '/order', exact: true, name: 'Order List', component: OrderList },
    { path: '/withrawal', exact: true, name: 'withrawal List', component: WithrawalRequest },
    { path: '/profile', exact: true, name: 'Profile List', component: ProfileList },

    // sanple page
    { path: '/sample-page', exact: true, name: 'Sample Page', component: OtherSamplePage }
];
export default routes;
