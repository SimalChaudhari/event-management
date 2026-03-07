import Header from './components/Header';
import BottomNav from './components/BottomNav';
import { AppRoutes } from './routes';

function App() {
  return (
    <div className="min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <Header />
      <main className="px-4 py-6 max-w-app mx-auto border-x border-slate-200 md:max-w-[1200px] md:border-0 md:px-6 md:py-12 md:pb-12">
        <AppRoutes />
      </main>
      <BottomNav />
    </div>
  );
}

export default App;
