import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import {  useSelector, useDispatch } from 'react-redux';
import Loader from './layout/Loader';
import routesOnePage from '../route';
import routes from '../routes';
import Config from '../config';
import { checkAuthStatus } from '../store/actions/authActions';

const AdminLayout = lazy(() => import('./layout/AdminLayout'));

const App = () => {
    const { authenticated, loading } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(checkAuthStatus());
    }, [dispatch]);


    if (loading) {
        return <Loader />;
    }

    return (
        <BrowserRouter basename={Config.basename}>
            <Suspense fallback={<Loader />}>
                <Routes>
                    {/* Public Routes */}
                    {routesOnePage.map((route, index) =>
                        route.component && (
                            <Route
                                key={index}
                                path={route.path}
                                element={
                                    authenticated ? (
                                        <Navigate to={Config.defaultPath} replace />
                                    ) : (
                                        <route.component />
                                    )
                                }
                            />
                        )
                    )}
                    
                    {/* Protected Routes */}
                    {authenticated ? (
                        <Route path="/" element={<AdminLayout />}>
                            {routes.map((route, index) => (
                                <Route
                                    key={index}
                                    path={route.path}
                                    element={<route.component />}
                                />
                            ))}
                            {/* Add a catch-all route for authenticated users */}
                            <Route path="*" element={<Navigate to={Config.defaultPath} />} />
                        </Route>
                    ) : (
                        <Route path="*" element={<Navigate to="/auth/signin" />} />
                    )}
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
};

export default App;
