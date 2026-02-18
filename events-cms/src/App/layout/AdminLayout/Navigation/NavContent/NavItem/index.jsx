import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import useWindowSize from '../../../../../../hooks/useWindowSize';
import NavIcon from './../NavIcon';
import NavBadge from './../NavBadge';
import * as actionTypes from '../../../../../../store/actions';
// import { useSelector } from '../../../../../../store/reducer';
const NavItem = (props) => {
    const { windowWidth } = useWindowSize();
    const dispatch = useDispatch();
    const location = useLocation();
    const layout = useSelector((state) => state.able.layout);
    const collapseMenu = useSelector((state) => state.able.collapseMenu);
    const onItemClick = () => {
        // On mobile, toggle menu
        if (windowWidth < 992) {
            dispatch({ type: actionTypes.COLLAPSE_MENU });
        }
        // On desktop (>= 992px), if menu is collapsed, expand it when clicking icon
        // Only expand if window is wide enough to show full menu comfortably
        else if (windowWidth >= 992 && collapseMenu) {
            dispatch({ type: actionTypes.COLLAPSE_MENU });
        }
    };
    const onItemLeave = () => dispatch({ type: actionTypes.NAV_CONTENT_LEAVE });
    let itemTitle = props.item.title;
    if (props.item.icon) {
        itemTitle = <span className="pcoded-mtext">{props.item.title}</span>;
    }
    let itemTarget = '';
    if (props.item.target) {
        itemTarget = '_blank';
    }
    
    // Check if current path matches this menu item (including child routes for specific items)
    const shouldMatchChildRoutes = [
        'users', 
        'speakers', 
        'exhibitors',
        'all-events',
        'upcoming-events',
        'registered-events',
        'categories',
        'surveys',
        'polling',
        'order ',
        'engagements'
    ].includes(props.item.id);
    
    // Special handling for categories - match /events/*-category routes
    let isActive;
    if (props.item.id === 'categories') {
        isActive = location.pathname === '/categories' ||
            location.pathname.startsWith('/events/add-category') ||
            location.pathname.startsWith('/events/edit-category') ||
            location.pathname.startsWith('/events/view-category');
    } else {
        isActive = shouldMatchChildRoutes 
            ? location.pathname.startsWith(props.item.url)
            : location.pathname === props.item.url;
    }
    
    let subContent;
    if (props.item.external) {
        subContent = (<a href={props.item.url} target="_blank" rel="noopener noreferrer">
                <NavIcon items={props.item}/>
                {itemTitle}
                <NavBadge layout={layout} items={props.item}/>
            </a>);
    }
    else {
        subContent = (<NavLink 
                to={props.item.url} 
                className={isActive ? "nav-link active" : "nav-link"} 
                end={!shouldMatchChildRoutes}
                target={itemTarget}
            >
                <NavIcon items={props.item}/>
                {itemTitle}
                <NavBadge layout={layout} items={props.item}/>
            </NavLink>);
    }
    // Add active class to li element if item is active
    const liClassName = isActive 
        ? (props.item.classes ? `${props.item.classes} active` : 'active')
        : (props.item.classes || '');
    
    let mainContent;
    if (layout === 'horizontal') {
        mainContent = <li className={isActive ? 'active' : ''} onClick={onItemLeave}>{subContent}</li>;
    }
    else {
        if (windowWidth < 992) {
            mainContent = (<li className={liClassName} onClick={onItemClick}>
                    {subContent}
                </li>);
        }
        else {
            // On desktop, add onClick to expand menu when collapsed
            mainContent = (<li className={liClassName} onClick={onItemClick}>
                    {subContent}
                </li>);
        }
    }
    return <>{mainContent}</>;
};
export default NavItem;
