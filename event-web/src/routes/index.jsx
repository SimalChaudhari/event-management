import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/home/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyEmail from '../pages/auth/VerifyEmail';
import Rewards from '../pages/rewards/Rewards';
import ScanQR from '../pages/scan/ScanQR';
import Gallery from '../pages/gallery/Gallery';
import Profile from '../pages/profile/Profile';
import EventDetail from '../pages/events/EventDetail';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROUTES } from '../routes/routeConfig';

/**
 * All app routes – single place to add/change routes
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
      <Route path="/rewards" element={<Rewards />} />
      <Route path="/scan" element={<ScanQR />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/event/:id" element={<EventDetail />} />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
