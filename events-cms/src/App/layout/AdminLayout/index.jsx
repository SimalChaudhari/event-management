import React, { useEffect, Suspense } from 'react';
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

    const collapseMenu = useSelector((state) => state.able.collapseMenu);
    const layout = useSelector((state) => state.able.layout);
    const subLayout = useSelector((state) => state.able.subLayout);

    useEffect(() => {
        if (windowWidth > 992 && windowWidth <= 1024 && layout !== 'horizontal') {
            dispatch({ type: actionTypes.COLLAPSE_MENU });
        }
    }, [windowWidth, layout, dispatch]);

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
