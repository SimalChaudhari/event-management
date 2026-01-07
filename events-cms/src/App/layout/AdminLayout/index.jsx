import React, { useEffect, useRef, Suspense } from 'react';
import {Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navigation from './Navigation';
import NavBar from './NavBar';
import Breadcrumb from './Breadcrumb';
import Configuration from './Configuration';
import Loader from '../Loader';
import useWindowSize from '../../../hooks/useWindowSize';
import * as actionTypes from '../../../store/actions';

const AdminLayout = () => {
    const { windowWidth } = useWindowSize();
    const dispatch = useDispatch();
    const prevWidthRef = useRef(windowWidth);

    const collapseMenu = useSelector((state) => state.able.collapseMenu);
    const layout = useSelector((state) => state.able.layout);
    const subLayout = useSelector((state) => state.able.subLayout);

    useEffect(() => {
        // Only auto-manage menu state when crossing breakpoint thresholds
        // This prevents flipping when resizing between 900-1000px
        const prevWidth = prevWidthRef.current;
        const wasInMediumRange = prevWidth > 992 && prevWidth <= 1024;
        const isInMediumRange = windowWidth > 992 && windowWidth <= 1024;
        const wasAboveLarge = prevWidth > 1024;
        const isAboveLarge = windowWidth > 1024;

        // Only auto-collapse when entering medium range from outside, not on every resize
        if (layout !== 'horizontal') {
            if (!wasInMediumRange && isInMediumRange && !collapseMenu) {
                // Entering medium range - auto-collapse if expanded
                dispatch({ type: actionTypes.COLLAPSE_MENU });
            }
            // Auto-expand when moving from medium to large range
            else if (wasInMediumRange && isAboveLarge && collapseMenu) {
                // Moving to large range - auto-expand if collapsed
                dispatch({ type: actionTypes.COLLAPSE_MENU });
            }
        }

        prevWidthRef.current = windowWidth;
    }, [windowWidth, layout, dispatch, collapseMenu]);

    const mobileOutClickHandler = () => {
        if (windowWidth < 992 && collapseMenu) {
            dispatch({ type: actionTypes.COLLAPSE_MENU });
        }
    };

    let mainClass = ['pcoded-wrapper'];
    if (layout === 'horizontal' && subLayout === 'horizontal-2') {
        mainClass = [...mainClass, 'container'];
    }

    return (
        <>
            <Navigation />
            <NavBar />
            <div
                className="pcoded-main-container"
                onClick={mobileOutClickHandler}
            >
                <div className={mainClass.join(' ')}>
                    <div className="pcoded-content">
                        <div className="pcoded-inner-content">
                            <Breadcrumb />
                            <div className="main-body">
                                <div className="page-wrapper">
                                    <Suspense fallback={<Loader />}>
                                        <Outlet />
                                    </Suspense>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Configuration />
        </>
    );
};

export default AdminLayout;
