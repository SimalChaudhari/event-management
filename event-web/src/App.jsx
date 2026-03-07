import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
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
      <main className="px-4 py-6 max-w-app mx-auto md:max-w-[1200px] md:px-6 md:py-12 md:pb-12 flex-1 w-full">
        <AppRoutes />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

export default App;
