import { Routes, Route } from 'react-router-dom';
import Home from '../pages/home/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyEmail from '../pages/auth/VerifyEmail';
import ScanQR from '../pages/scan/ScanQR';
import Engagement from '../pages/engagement/Engagement';
import Profile from '../pages/profile/Profile';
import EventDetail from '../pages/events/EventDetail';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import { ForgotPasswordGuard, ResetPasswordGuard } from '../components/AuthFlowGuard';
import MainLayout from '../components/MainLayout';
import AuthLayout from '../components/AuthLayout';
import { ROUTES } from '../routes/routeConfig';

/**
 * All app routes – single place to add/change routes.
 * Routes under MainLayout get the shared PageLayout (card + optional hero via usePageHero).
 * Auth routes use AuthLayout (PageLayout + spacing so footer does not overflow on scroll).
 * Forgot/Reset password are guarded: only reachable via the intended auth flow (see AuthFlowGuard).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path="/event/:id" element={<EventDetail />} />

      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordGuard />}>
          <Route index element={<ForgotPassword />} />
        </Route>
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordGuard />}>
          <Route index element={<ResetPassword />} />
        </Route>
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/engagement" element={<Engagement />} />
        <Route path="/scan" element={<ScanQR />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
