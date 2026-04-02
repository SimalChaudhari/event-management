import * as React from 'react';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useWindowSize from '../../../../../../hooks/useWindowSize';
import DEMO from '../../../../../../store/constant';
import * as actionTypes from '../../../../../../store/actions';
// import { useSelector } from '../../../../../../store/reducer';
import NavIcon from './../NavIcon';
import NavBadge from './../NavBadge';
import NavItem from '../NavItem';
import LoopNavCollapse from './index';
const NavCollapse = (props) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { windowWidth } = useWindowSize();
    const layout = useSelector((state) => state.able.layout);
    const isOpen = useSelector((state) => state.able.isOpen);
    const isTrigger = useSelector((state) => state.able.isTrigger);
    const collapseMenu = useSelector((state) => state.able.collapseMenu);
    const prevPathnameRef = useRef(location.pathname);
    const onCollapseToggle = (id, type) => dispatch({ type: actionTypes.COLLAPSE_TOGGLE, menu: { id: id, type: type } });
    const onNavCollapseLeave = (id, type) => dispatch({ type: actionTypes.NAV_COLLAPSE_LEAVE, menu: { id: id, type: type } });
    const onCollapseClick = () => {
        if (windowWidth < 992) {
            dispatch({ type: actionTypes.COLLAPSE_MENU });
        }
        // On desktop (>= 992px), if menu is collapsed, expand it when clicking collapse
        else if (windowWidth >= 992 && collapseMenu) {
            dispatch({ type: actionTypes.COLLAPSE_MENU });
        }
    };
    
    // Check if any child item matches the current path
    const checkChildActive = () => {
        if (props.collapse.children) {
            return props.collapse.children.some((child) => {
                if (child.type === 'item' && child.url) {
                    const pathname = location.pathname;
                    const childUrl = child.url;
                    const childId = child.id;
                    
                    // Special handling for Events collapse - exclude category routes completely
                    if (props.collapse.id === 'events') {
                        // Never match category routes for Events collapse
                        if (pathname.includes('/add-category') ||
                            pathname.includes('/edit-category') ||
                            pathname.includes('/view-category') ||
                            pathname.includes('/categories')) {
                            return false;
                        }
                        // Only match actual event routes
                        if (childUrl === '/events') {
                            if (pathname === '/events' ||
                                pathname.startsWith('/events/view-event/') ||
                                pathname.startsWith('/events/edit-event/') ||
                                pathname === '/events/add-event' ||
                                pathname.startsWith('/events/view-upcoming-event/') ||
                                pathname.startsWith('/events/edit-upcoming-event/') ||
                                pathname === '/events/add-upcoming-event' ||
                                pathname.startsWith('/events/view-registered-event/') ||
                                pathname.startsWith('/events/edit-registered-event/') ||
                                pathname === '/events/add-registered-event') {
                                return true;
                            }
                        }
                        return false;
                    }
                    
                    // Special handling for Module collapse - match category routes even though they're under /events/
                    if (props.collapse.id === 'Module') {
                        if (childId === 'categories') {
                            // Category routes are under /events/ but belong to Module
                            if (pathname === '/categories' ||
                                pathname.startsWith('/events/add-category') ||
                                pathname.startsWith('/events/edit-category') ||
                                pathname.startsWith('/events/view-category')) {
                                return true;
                            }
                            // If not a category route, don't match
                            return false;
                        }
                        // For other Module children (surveys, polling, etc.), use standard check
                        if (['surveys', 'polling', 'order ', 'engagements'].includes(childId)) {
                            if (pathname.startsWith(childUrl)) {
                                const remainingPath = pathname.substring(childUrl.length);
                                if (remainingPath === '' || remainingPath.startsWith('/')) {
                                    return true;
                                }
                            }
                            return false;
                        }
                        // For other Module children, use exact match
                        return pathname === childUrl;
                    }
                    
                    if (props.collapse.id === 'Media Library') {
                        if (pathname.startsWith(childUrl)) {
                            const remainingPath = pathname.substring(childUrl.length);
                            if (remainingPath === '' || remainingPath.startsWith('/')) {
                                return true;
                            }
                        }
                        return pathname === childUrl;
                    }
                    
                    // For items that should match child routes (for other collapses)
                    const shouldMatchChildRoutes = [
                        'users', 
                        'speakers', 
                        'exhibitors',
                        'all-events',
                        'upcoming-events',
                        'registered-events'
                    ].includes(childId);
                    
                    if (shouldMatchChildRoutes) {
                        // For other collapses, use standard startsWith check
                        if (pathname.startsWith(childUrl)) {
                            const remainingPath = pathname.substring(childUrl.length);
                            if (remainingPath === '' || remainingPath.startsWith('/')) {
                                return true;
                            }
                        }
                        return false;
                    }
                    return location.pathname === child.url;
                }
                return false;
            });
        }
        return false;
    };
    
    useEffect(() => {
        // Only run on pathname changes, not on component re-renders
        const pathnameChanged = prevPathnameRef.current !== location.pathname;
        
        if (!pathnameChanged) {
            return; // Don't do anything if pathname hasn't changed
        }
        
        // Check if pathname actually matches this collapse's routes
        // First check if any child URL matches
        const isChildActive = checkChildActive();
        
        // Then check if collapse id is in pathname (but only if it's actually part of the route)
        let currentIndex = -1;
        
        // Special handling for Events collapse - exclude category routes (gallery is managed from event icon under Events)
        if (props.collapse.id === 'events') {
            if (location.pathname.includes('/add-category') ||
                location.pathname.includes('/edit-category') ||
                location.pathname.includes('/view-category') ||
                location.pathname.includes('/categories')) {
                currentIndex = -1;
            } else if (props.collapse.id && location.pathname.includes(props.collapse.id)) {
                const pathParts = location.pathname.split('/').filter(part => part);
                currentIndex = pathParts.findIndex((id) => id === props.collapse.id);
            }
        } else if (props.collapse.id === 'Module') {
            // Special handling for Module collapse - match category routes
            if (location.pathname === '/categories' ||
                location.pathname.includes('/add-category') ||
                location.pathname.includes('/edit-category') ||
                location.pathname.includes('/view-category') ||
                location.pathname.startsWith('/surveys') ||
                location.pathname.startsWith('/polls') ||
                location.pathname.startsWith('/order') ||
                location.pathname.startsWith('/engagements')) {
                // Module collapse should be active for these routes
                currentIndex = 0; // Set to 0 to indicate it should be open
            }
        } else {
            // For other collapses, normal check
            if (props.collapse.id && location.pathname.includes(props.collapse.id)) {
                const pathParts = location.pathname.split('/').filter(part => part);
                currentIndex = pathParts.findIndex((id) => id === props.collapse.id);
            }
        }
        
        // Only consider it should be open if:
        // 1. A child is active (most reliable check)
        // 2. OR collapse id is in pathname AND it's not just a substring match
        const shouldBeOpen = isChildActive || (currentIndex > -1);
        
        // Only auto-open if:
        // 1. Pathname changed
        // 2. Current path matches this collapse
        // 3. Menu is not already open
        if (shouldBeOpen) {
            const isCurrentlyOpen = isOpen.includes(props.collapse.id);
            
            // Open if not currently open
            if (!isCurrentlyOpen) {
                onCollapseToggle(props.collapse.id, props.type);
            }
        }
        
        // Update previous pathname
        prevPathnameRef.current = location.pathname;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);
    let navItems = '';
    if (props.collapse.children) {
        const collapses = props.collapse.children;
        navItems = Object.keys(collapses).map((key) => {
            const item = collapses[parseInt(key)];
            switch (item.type) {
                case 'collapse':
                    return <LoopNavCollapse key={item.id} collapse={item} type="sub"/>;
                case 'item':
                    return <NavItem layout={layout} key={item.id} item={item}/>;
                default:
                    return false;
            }
        });
    }
    let itemTitle = props.collapse.title;
    if (props.collapse.icon) {
        itemTitle = <span className="pcoded-mtext">{props.collapse.title}</span>;
    }
    let navLinkClass = ['nav-link'];
    let navItemClass = ['nav-item', 'pcoded-hasmenu'];
    const openIndex = isOpen.findIndex((id) => id === props.collapse.id);
    if (openIndex > -1) {
        navItemClass = [...navItemClass, 'active'];
        if (layout !== 'horizontal') {
            navLinkClass = [...navLinkClass, 'active'];
        }
    }
    const triggerIndex = isTrigger.findIndex((id) => id === props.collapse.id);
    if (triggerIndex > -1) {
        navItemClass = [...navItemClass, 'pcoded-trigger'];
    }
    // Check if collapse should be active for styling (exclude category routes for Events)
    let shouldBeActiveForStyling = false;
    
    if (props.collapse.id === 'events') {
        // Events collapse should NOT be active for category or gallery routes
        if (!location.pathname.includes('/add-category') &&
            !location.pathname.includes('/edit-category') &&
            !location.pathname.includes('/view-category') &&
            !location.pathname.includes('/categories')) {
            const currentIndex = location.pathname
                .toString()
                .split('/')
                .findIndex((id) => id === props.collapse.id);
            const isChildActive = checkChildActive();
            shouldBeActiveForStyling = (currentIndex > -1 && currentIndex > 0) || isChildActive;
        }
    } else {
        const currentIndex = location.pathname
            .toString()
            .split('/')
            .findIndex((id) => id === props.collapse.id);
        const isChildActive = checkChildActive();
        shouldBeActiveForStyling = (currentIndex > -1 && currentIndex > 0) || isChildActive;
    }
    
    if (shouldBeActiveForStyling) {
        navItemClass = [...navItemClass, 'active'];
        if (layout !== 'horizontal') {
            navLinkClass = [...navLinkClass, 'active'];
        }
    }
    const subContent = (<>
            <a 
                href={DEMO.BLANK_LINK} 
                className={navLinkClass.join(' ')} 
                onClick={() => {
                    // On desktop (>= 992px), if menu is collapsed, expand it first
                    if (windowWidth >= 992 && collapseMenu) {
                        dispatch({ type: actionTypes.COLLAPSE_MENU });
                    }
                    onCollapseToggle(props.collapse.id, props.type);
                    if (windowWidth < 992) {
                        // On mobile, close main menu when clicking collapse
                        onCollapseClick();
                    }
                }}
            >
                <NavIcon items={props.collapse}/>
                {itemTitle}
                <NavBadge layout={layout} items={props.collapse}/>
            </a>
            <ul className="pcoded-submenu">{navItems}</ul>
        </>);
    let mainContent = '';
    if (layout === 'horizontal') {
        mainContent = (<li className={navItemClass.join(' ')} onMouseLeave={() => onNavCollapseLeave(props.collapse.id, props.type)} onMouseEnter={() => onCollapseToggle(props.collapse.id, props.type)}>
                {subContent}
            </li>);
    }
    else {
        mainContent = <li className={navItemClass.join(' ')}>{subContent}</li>;
    }
    return <>{mainContent}</>;
};
export default NavCollapse;
