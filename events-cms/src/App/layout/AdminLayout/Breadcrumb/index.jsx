import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import config from '../../../../config';
import navigation from '../../../../menu-items';
import DEMO from '../../../../store/constant';

// Extended navigation structure for breadcrumbs (includes dynamic routes)
const breadcrumbNavigation = {
    items: [
        ...navigation.items,
        // Add dynamic routes for breadcrumb matching
        {
            id: 'dynamic-routes',
            title: 'Dynamic Routes',
            type: 'group',
            children: [
                {
                    id: 'users-dynamic',
                    title: 'Users',
                    type: 'collapse',
                    children: [
                        { id: 'add-user', title: 'Add User', type: 'item', url: '/users/add-user' },
                        { id: 'edit-user', title: 'Edit User', type: 'item', url: '/users/edit-user/:id' },
                        { id: 'view-user', title: 'View User', type: 'item', url: '/users/view-user/:id' }
                    ]
                },
                {
                    id: 'speakers-dynamic',
                    title: 'Speakers',
                    type: 'collapse',
                    children: [
                        { id: 'add-speaker', title: 'Add Speaker', type: 'item', url: '/speakers/add-speaker' },
                        { id: 'edit-speaker', title: 'Edit Speaker', type: 'item', url: '/speakers/edit-speaker/:id' },
                        { id: 'view-speaker', title: 'View Speaker', type: 'item', url: '/speakers/view-speaker/:id' }
                    ]
                },
                {
                    id: 'events-dynamic',
                    title: 'Events',
                    type: 'collapse',
                    children: [
                        { id: 'add-event', title: 'Add Event', type: 'item', url: '/events/add-event' },
                        { id: 'edit-event', title: 'Edit Event', type: 'item', url: '/events/edit-event/:id' },
                        { id: 'view-event', title: 'View Event', type: 'item', url: '/events/view-event/:id' },
                        { id: 'add-register-event', title: 'Add Register Event', type: 'item', url: '/registred/add-register-event' },
                        { id: 'edit-register-event', title: 'Edit Register Event', type: 'item', url: '/registred/edit-register-event/:id' },
                        { id: 'view-register-event', title: 'View Register Event', type: 'item', url: '/registred/view-register-event/:id' },
                        { id: 'qa-management', title: 'Q&A Management', type: 'item', url: '/events/qa/:eventId' }
                    ]
                },
                {
                    id: 'exhibitors-dynamic',
                    title: 'Exhibitors',
                    type: 'collapse',
                    children: [
                        { id: 'add-exhibitor', title: 'Add Exhibitor', type: 'item', url: '/exhibitors/add-exhibitor' },
                        { id: 'edit-exhibitor', title: 'Edit Exhibitor', type: 'item', url: '/exhibitors/edit-exhibitor/:id' },
                        { id: 'view-exhibitor', title: 'View Exhibitor', type: 'item', url: '/exhibitors/view-exhibitor/:id' }
                    ]
                },
                {
                    id: 'categories-dynamic',
                    title: 'Categories',
                    type: 'collapse',
                    children: [
                        { id: 'add-category', title: 'Add Category', type: 'item', url: '/events/add-category' },
                        { id: 'edit-category', title: 'Edit Category', type: 'item', url: '/events/edit-category/:id' },
                        { id: 'view-category', title: 'View Category', type: 'item', url: '/events/view-category/:id' }
                    ]
                },
                {
                    id: 'surveys-dynamic',
                    title: 'Surveys',
                    type: 'collapse',
                    children: [
                        { id: 'add-survey', title: 'Add Survey', type: 'item', url: '/surveys/add' },
                        { id: 'edit-survey', title: 'Edit Survey', type: 'item', url: '/surveys/edit/:id' },
                        { id: 'view-survey', title: 'View Survey', type: 'item', url: '/surveys/view/:id' }
                    ]
                },
                {
                    id: 'gallery-dynamic',
                    title: 'Gallery',
                    type: 'collapse',
                    children: [
                        { id: 'add-gallery', title: 'Add Gallery', type: 'item', url: '/events/gallery/add' },
                        { id: 'edit-gallery', title: 'Edit Gallery', type: 'item', url: '/events/gallery/edit' },
                        { id: 'view-gallery', title: 'View Gallery', type: 'item', url: '/events/gallery/view/:id' }
                    ]
                },
                {
                    id: 'engagement-dynamic',
                    title: 'Engagement',
                    type: 'collapse',
                    children: [
                        { id: 'list-engagement', title: 'Engagement List', type: 'item', url: '/engagements' },
                        { id: 'add-engagement', title: 'Add Engagement', type: 'item', url: '/engagements/add' },
                        { id: 'edit-engagement', title: 'Edit Engagement', type: 'item', url: '/engagements/edit/:id' },
                        { id: 'view-engagement', title: 'View Engagement', type: 'item', url: '/engagements/view/:id' },
                        { id: 'engagement-sessions', title: 'Engagement Sessions', type: 'item', url: '/engagements/sessions/:trackId' },
                        { id: 'view-engagement-session', title: 'View Engagement Session', type: 'item', url: '/engagements/view-session/:id' }
                    ]
                }
            ]
        }
    ]
};
const Breadcrumb = (props) => {
    const [main, setMain] = useState();
    const [item, setItem] = useState();
    const location = useLocation();
    const navigate = useNavigate();
    
    const getCollapse = useCallback((item) => {
        if (item.children) {
            item.children.filter((collapse) => {
                if (collapse.type && collapse.type === 'collapse') {
                    getCollapse(collapse);
                }
                else if (collapse.type && collapse.type === 'item') {
                    // Check for exact match first
                    if (location.pathname === config.basename + collapse.url) {
                        setItem(collapse);
                        setMain(item);
                    }
                    // Check for dynamic routes with parameters
                    else if (collapse.url && collapse.url.includes(':')) {
                        const routePattern = collapse.url.replace(/:[^/]+/g, '[^/]+');
                        const regex = new RegExp('^' + config.basename + routePattern + '$');
                        if (regex.test(location.pathname)) {
                            setItem(collapse);
                            setMain(item);
                        }
                    }
                }
                return false;
            });
        }
    }, [location.pathname]);

    useEffect(() => {
        breadcrumbNavigation.items.map((item, index) => {
            if (item.type && item.type === 'group') {
                getCollapse(item);
            }
            return false;
        });
        
        // Fallback for routes not found in menu structure
        if (!main && !item) {
            const pathSegments = location.pathname.split('/').filter(segment => segment);
            if (pathSegments.length > 0) {
                // Try to find a parent route that matches
                const parentPath = '/' + pathSegments.slice(0, -1).join('/');
                let foundParent = false;
                
                breadcrumbNavigation.items.forEach(group => {
                    if (group.children) {
                        group.children.forEach(collapse => {
                            if (collapse.children) {
                                collapse.children.forEach(child => {
                                    if (child.url === parentPath) {
                                        setMain(collapse);
                                        // Create a dynamic item for the current route
                                        const dynamicItem = {
                                            title: pathSegments[pathSegments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                            type: 'item',
                                            url: location.pathname
                                        };
                                        setItem(dynamicItem);
                                        foundParent = true;
                                    }
                                });
                            }
                        });
                    }
                });
                
                // If no parent found, try to find a grandparent route
                if (!foundParent && pathSegments.length > 2) {
                    const grandparentPath = '/' + pathSegments.slice(0, -2).join('/');
                    breadcrumbNavigation.items.forEach(group => {
                        if (group.children) {
                            group.children.forEach(collapse => {
                                if (collapse.children) {
                                    collapse.children.forEach(child => {
                                        if (child.url === grandparentPath) {
                                            setMain(collapse);
                                            // Create a dynamic item for the current route
                                            const dynamicItem = {
                                                title: pathSegments[pathSegments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                                type: 'item',
                                                url: location.pathname
                                            };
                                            setItem(dynamicItem);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        }
    }, [props, getCollapse, location.pathname, main, item]);
    
    let main_, item_;
    let breadcrumb = '';
    let title = 'Welcome';

        // Handler for when main collapse item is clicked
        const handleMainClick = () => {
            if (main && main.children && main.children.length > 0) {
                // Navigate to the first child URL by default
                const firstChildUrl = main.children[0].url;
                if (firstChildUrl) {
                    navigate(firstChildUrl);
                }
            }
        };

    if (main && main.type === 'collapse') {
        main_ = (
            <li className="breadcrumb-item">
                <a onClick={handleMainClick} style={{cursor: 'pointer'}}>
                    {main.title}
                </a>
            </li>
        );
    }
    if (item && item.type === 'item') {
        title = item.title;
        item_ = (<li className="breadcrumb-item">
                <a href={DEMO.BLANK_LINK}>{title}</a>
            </li>);
        if (item.breadcrumbs !== false) {
            breadcrumb = (<div className="page-header">
                    <div className="page-block">
                        <div className="row align-items-center">
                            <div className="col-md-12">
                                <div className="page-header-title">
                                    <h5 className="m-b-10">{title}</h5>
                                </div>
                                <ul className="breadcrumb">
                                    <li className="breadcrumb-item">
                                        <Link to="/">
                                            <i className="feather icon-home"/>
                                        </Link>
                                    </li>
                                    {main_}
                                    {item_}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>);
        }
    }
    document.title = title + ' | CRM';
    return <>{breadcrumb}</>;
};
export default Breadcrumb;
