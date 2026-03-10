import { Outlet } from 'react-router-dom';
import PageLayout from './PageLayout';

/**
 * Layout for auth pages – card only on desktop (md+); no card on mobile.
 */
export default function AuthLayout() {
  return (
    <PageLayout hero={null} cardOnDesktop={false} className="auth-layout">
      <div className="auth-layout__content px-4 py-6">
        <div className="max-w-md mx-auto md:p-6 md:bg-white md:rounded-2xl md:shadow-lg md:border md:border-slate-200">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  );
}
