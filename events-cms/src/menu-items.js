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
                    url: '/'
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
                    id: 'categories',
                    title: 'Categories',
                    type: 'item',
                    icon: 'feather icon-tag',
                    url: '/categories'
                },
                {
                    id: 'speakers',
                    title: 'Speakers',
                    type: 'item',
                    icon: 'feather icon-users',
                    url: '/speakers'
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
            id: 'media-manager',
            title: 'Media Manager',
            type: 'group',
            icon: 'icon-ui',
            children: [
                {
                    id: 'gallery',
                    title: 'Gallery',
                    type: 'item',
                    icon: 'feather icon-image',
                    url: '/media-manager/gallery'
                },
                {
                    id: 'banners',
                    title: 'Banners',
                    type: 'item',
                    icon: 'feather icon-image',
                    url: '/media-manager/banner-management'
                }
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
        // Settings 
        {
            id: 'system-config',
            title: 'System Configuration',
            type: 'group',
            icon: 'icon-ui',
            children: [
                {
                    id: 'settings',
                    title: 'Settings',
                    type: 'collapse',
                    icon: 'feather icon-settings',
                    children: [
                        {
                            id: 'profile',
                            title: 'Profile',
                            type: 'item',
                           
                            url: '/profile'
                        },
                        {
                            id: 'terms-conditions',
                            title: 'Terms and Conditions',
                            type: 'item',
                           
                            url: '/settings/terms-conditions'
                        },
                        {
                            id: 'privacy-policy',
                            title: 'Privacy Policy',
                            type: 'item',
                          
                            url: '/settings/privacy-policy'
                        },
                     
                    ]
                }
            ]
        },
    ]
};
export default chartData;
