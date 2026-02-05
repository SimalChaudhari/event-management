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
                }
            ]
        },

        //Members
        {
            id: 'members',
            title: 'Members',
            type: 'group',
            icon: 'icon-monitor',
            children: [
                {
                    id: 'users',
                    title: 'Users',
                    type: 'item',
                    icon: 'feather icon-user',
                    url: '/users'
                },
                // {
                //     id: 'exhibitors',
                //     title: 'Exhibitor Booths',
                //     type: 'item',
                //     icon: 'feather icon-users', // Group of people icon
                //     url: '/exhibitors'
                // },
                {
                    id: 'speakers',
                    title: 'Speakers',
                    type: 'item',
                    icon: 'feather icon-mic',
                    url: '/speakers'
                }
            ]
        },

        {
            id: 'management',
            title: 'Management',
            type: 'group',
            icon: 'icon-monitor',
            children: [
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
                            url: '/events'
                        },
                        {
                            id: 'upcoming-events',
                            title: 'Upcoming Events',
                            type: 'item',
                            url: '/upcoming',
                            badge: {
                                title: 'NEW',
                                type: 'badge-danger'
                            }
                        },
                        {
                            id: 'registered-events',
                            title: 'Registered Events',
                            type: 'item',
                            url: '/registered'
                        }
                    ]
                },
                {
                    id: 'Business Hub',
                    title: 'Business Hub',
                    type: 'collapse',
                    icon: 'feather icon-briefcase',
                    children: [
                        {
                            id: 'exhibitors',
                            title: 'Exhibitor Booths',
                            type: 'item',
                            // icon: 'feather icon-users', // Group of people icon
                            url: '/exhibitors'
                        },
                        {
                            id: 'withrawal ',
                            title: 'Withdrawal Requests',
                            type: 'item',
                            // icon: 'feather icon-credit-card',
                            url: '/withrawal'
                        }
                    ]
                },

                {
                    id: 'Module',
                    title: 'Module',
                    type: 'collapse',
                    icon: 'feather icon-package',
                    children: [
                        {
                            id: 'categories',
                            title: 'Categories',
                            type: 'item',
                            // icon: 'feather icon-tag',
                            url: '/categories'
                        },
                        {
                            id: 'surveys',
                            title: 'Surveys',
                            type: 'item',
                            // icon: 'feather icon-clipboard',
                            url: '/surveys'
                        },
                        {
                            id: 'polling',
                            title: 'Polling',
                            type: 'item',
                            // icon: 'feather icon-bar-chart-2',
                            url: '/polls',
                            badge: {
                                title: 'NEW',
                                type: 'badge-info'
                            }
                        },
                {
                    id: 'order ',
                    title: 'Orders ',
                    type: 'item',
                    // icon: 'feather icon-shopping-cart',
                    badge: {
                        title: 'New',
                        type: 'badge-success'
                    },
                    url: '/order'
                },
                // Temporarily hidden - will be enabled later
                // {
                //     id: 'programme',
                //     title: 'Programme',
                //     type: 'item',
                //     // icon: 'feather icon-list',
                //     url: '/programme'
                // },
                {
                    id: 'engagements',
                    title: 'Engagement',
                    type: 'item',   
                    // icon: 'feather icon-users',
                    url: '/engagements',
                    badge: {
                        title: 'NEW',
                        type: 'badge-success'
                    }
                },
                // {
                //     id: 'moderators',
                //     title: 'Moderators',
                //     type: 'item',
                //     // icon: 'feather icon-shield',
                //     url: '/moderators',
                //     badge: {
                //         title: 'NEW',
                //         type: 'badge-info'
                //     }
                // }
                    ]
                }
            ]
        },
        {
            id: 'media-manager',
            title: 'Media Manager',
            type: 'group',
            icon: 'icon-ui',
            children: [
                {
                    id: 'Media Library',
                    title: 'Media Library',
                    type: 'collapse',
                    icon: 'feather icon-image',
                    children: [
                {
                    id: 'gallery',
                    title: 'Gallery',
                    type: 'item',
                    // icon: 'feather icon-image',
                    url: '/media-manager/gallery'
                },
                {
                    id: 'banners',
                    title: 'Banners',
                    type: 'item',
                    // icon: 'feather icon-image',
                    url: '/media-manager/banner-management'
                },
                {
                    id: 'logo-management',
                    title: 'Logo Management',
                    type: 'item',
                    // icon: 'feather icon-image',
                    url: '/media-manager/logo-management'
                },
                {
                    id: 'coupons',
                    title: 'Coupons',
                    type: 'item',
                    url: '/media-manager/coupons'
                }
            ]
            }
            ]
        },
        // Settings
        {
            id: 'system-config',
            title: 'Configuration & Reports',
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
                            id: 'email-templates',
                            title: 'Email Templates',
                            type: 'item',
                            url: '/settings/email-templates'
                        },
                        {
                            id: 'privacy-policy',
                            title: 'Privacy Policy',
                            type: 'item',

                            url: '/settings/privacy-policy'
                        },
                    ]
                },
                {
                    id: 'reports',
                    title: 'Reports',
                    type: 'item',
                    icon: 'feather icon-bar-chart',
                    url: '/reports'
                   
                },
                {
                    id: 'logs',
                    title: 'System Logs',
                    type: 'item',
                    icon: 'feather icon-file-text',
                    url: '/logs',
                    badge: {
                        title: 'NEW',
                        type: 'badge-info'
                    }
                },
                {
                    id: 'push-notifications',
                    title: 'Notifications',
                    type: 'item',
                    icon: 'feather icon-bell',
                    url: '/push-notifications',
                 
                },
            ]
        },
     
    ]
};
export default chartData;
