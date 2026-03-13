import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import Breadcrumb from './components/Breadcrumb';
import DocumentTitle from './components/DocumentTitle';
import SkipToContent from './components/SkipToContent';
import { PageLayoutProvider } from './context/PageLayoutContext';
import { AppRoutes } from './routes';
import { ROUTES } from './routes/routeConfig';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const onLogout = () => navigate(ROUTES.LOGIN);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [navigate]);

  return (
    <div className="min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0 flex flex-col">
      <SkipToContent />
      <DocumentTitle />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        className="toast-container-header"
      />
      <Header />
      <main id="main-content" tabIndex={-1} className="px-4 py-6 max-w-app mx-auto md:max-w-[1200px] md:px-6 md:py-12 md:pb-12 flex-1 w-full min-w-0 min-h-0 flex flex-col overflow-x-hidden">
        <PageLayoutProvider>
          <Breadcrumb />
          <div className="flex-1 min-h-0 flex flex-col">
            <AppRoutes />
          </div>
        </PageLayoutProvider>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

export default App;
