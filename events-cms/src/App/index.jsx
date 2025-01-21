import * as React from 'react';
import { lazy, Suspense } from 'react';
import { Switch, Route, useLocation } from 'react-router-dom';
import '../../node_modules/font-awesome/scss/font-awesome.scss';
import Loader from './layout/Loader';
import ScrollToTop from './layout/ScrollToTop';
import routesOnePage from '../route';
import routes from '../routes';
import { Redirect } from 'react-router-dom';
import Config from '../config';
import { useDispatch, useSelector } from 'react-redux';
const AdminLayout = lazy(() => import('./layout/AdminLayout'));

const App = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    // const { isAuthenticated, loading } = useSelector((state) => state.auth);

    const [isAuthenticated,setIsAuthenticated] = React.useState(false)
    const [loading,setLoading] = React.useState(false)


    // Verify token on app load
    React.useEffect(() => {
        // dispatch(verifyToken());
    }, [dispatch]);

    if (loading) {
        return <Loader />; // Show loader while verifying token
    }

    return (<>
        <ScrollToTop>
            <Suspense fallback={<Loader />}>
                <Route path={routesOnePage.map((x) => x.path)}>
                    <Switch location={location} key={location.pathname}>
                        {routesOnePage.map((route, index) => {
                            return route.component ? (
                                <Route key={index} path={route.path} exact={route.exact}
                                    render={(props) => <route.component {...props} />} />) : null;
                        })}
                    </Switch>
                </Route>
                <Route path={routes.map((x) => x.path)}
                    render={(props) =>
                        isAuthenticated ? (
                            <AdminLayout {...props} />
                        ) : (
                            <Redirect to="/auth/signup-1" />
                        )
                    }
                />
                <Route path={'/*'} exact>
                    <Redirect to={Config.defaultPath} />
                </Route>
            </Suspense>
        </ScrollToTop>
        <div className="backdrop" />
    </>);
};
export default App;
