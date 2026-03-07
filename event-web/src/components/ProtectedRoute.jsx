import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../routes/routeConfig';

export default function ProtectedRoute({ children }) {
  const { authenticated } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!authenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  return children;
}
