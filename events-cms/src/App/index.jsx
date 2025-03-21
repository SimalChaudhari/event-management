import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import {  useSelector } from 'react-redux';
import Loader from './layout/Loader';
import routesOnePage from '../route';
import routes from '../routes';
import Config from '../config';

const AdminLayout = lazy(() => import('./layout/AdminLayout'));

const App = () => {
    const { authenticated } = useSelector((state) => state.auth);
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
                        </Route>
                    ) : (
                        <Route path="*" element={<Navigate to="/auth/signin-1" />} />
                    )}

                    {/* Default Redirect */}
                    <Route path="*" element={<Navigate to={Config.defaultPath} />} />
                </Routes>
            </Suspense>
        </BrowserRouter>

    );
};

export default App;
