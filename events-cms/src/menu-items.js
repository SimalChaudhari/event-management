const chartData = {
    items: [
        {
            id: 'dashboard',
            title: 'Dashboard',
            type: 'group',
            icon: 'icon-dashboard',
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
                    id: 'order ',
                    title: 'Orders ',
                    type: 'item',
                    icon: 'feather icon-shopping-cart',
                    badge: {
                        title: 'New',
                        type: 'badge-success'
                    },
                    url: '/order'


                },
                {
                    id: 'withrawal ',
                    title: 'Withdrawal Requests',
                    type: 'item',
                    icon: 'feather icon-credit-card',
                    url: '/withrawal'
                },

            ]
        },
        {
            id: 'reports',
            title: 'Reports',
            type: 'group',
            icon: 'icon-ui',
            children: [
    
                {
                    id: 'reports',
                    title: 'Reports',
                    type: 'item',
                    icon: 'feather icon-bar-chart',
                    url: '/reports'


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
                    id: 'profile',
                    title: 'Profile',
                    type: 'item',
                    icon: 'feather icon-user',
                    url: '/profile'

                }
            ]
        },

    ]
};
export default chartData;
