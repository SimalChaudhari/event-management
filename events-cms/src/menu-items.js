const chartData = {
    items: [
        {
            id: 'navigation',
            title: 'Navigation',
            type: 'group',
            icon: 'icon-navigation',
            children: [
                {
                    id: 'dashboard',
                    title: 'Dashboard',
                    type: 'item',
                    icon: 'feather icon-home',
                    url: '/dashboard'
                },

            ]
        },
        {
            id: 'management',
            title: 'Management',
            type: 'group',
            icon: 'icon-monitor',
            children: [
                {
                    id: 'users',
                    title: 'Users',
                    type: 'item',
                    icon: 'feather icon-users',
                    url: '/users'

                },
                {
                    id: 'events',
                    title: 'Events',
                    type: 'collapse',
                    icon: 'feather icon-calendar',
                    children: [
                        {
                            id: 'all-events',
                            title: 'All Events',
                            type: 'item',
                            url: '/events/event-list',
                            breadcrumbs: false
                        },
                        {
                            id: 'upcoming-events',
                            title: 'Upcoming Events',
                            type: 'item',
                            url: '/events/upcoming',
                            badge: {
                                title: 'NEW',
                                type: 'badge-danger'
                            }
                        },
                        {
                            id: 'registered-events',
                            title: 'Registered Events',
                            type: 'item',
                            url: '/events/registered'
                        }
                    ]

                },
                {
                    id: 'exhibitor ',
                    title: 'Exhibitor ',
                    type: 'item',
                    icon: 'feather icon-user-check',
                    url: '/exhibitor'

                },
                {
                    id: 'content ',
                    title: 'Content ',
                    type: 'item',
                    icon: 'feather icon-help-circle',
                    url: '/content'


                },
                {
                    id: 'notification ',
                    title: 'Notification ',
                    type: 'item',
                    icon: 'feather icon-book',
                    badge: {
                        title: 'New',
                        type: 'badge-success'
                    },
                    url: '/notification'
                },

            ]
        },
        {
            id: 'system-reports',
            title: 'System & Reports',
            type: 'group',
            icon: 'icon-ui',
            children: [
                {
                    id: 'points-rewards-system',
                    title: 'Points & Rewards',
                    type: 'item',
                    icon: 'feather icon-box',
                    url: '/rewards'


                },
                {
                    id: 'analytics-reports',
                    title: 'Analytics & Reports',
                    type: 'item',
                    icon: 'feather icon-gitlab',
                    url: '/analytics'


                }
            ]
        },

        {
            id: 'settings',
            title: 'Settings',
            type: 'group',
            icon: 'icon-ui',
            children: [
                {
                    id: 'tourism-transport',
                    title: 'Tourism & Transport ',
                    type: 'item',
                    icon: 'feather icon-box',
                    url: '/tourism'

                },
                {
                    id: 'profile',
                    title: 'Profile',
                    type: 'item',
                    icon: 'feather icon-gitlab',
                    url: '/profile'

                }
            ]
        },

    ]
};
export default chartData;
