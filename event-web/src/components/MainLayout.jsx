import { Outlet, useLocation } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { usePageLayoutHero } from '../context/PageLayoutContext';
import { LAYOUT_HERO } from '../routes/routeConfig';

const HERO_GRADIENT_CLASSES = 'bg-gradient-to-b from-[#71C0BB] to-[#010a08] px-6 pt-8 pb-6 md:pt-10 md:pb-8';

function DefaultHeroContent({ title, subtitle }) {
  return (
    <div className="text-center">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white drop-shadow-sm">{title}</h1>
      <p className="mt-2 text-white/90 text-sm md:text-base">{subtitle}</p>
      <div className="mt-4 mx-auto w-12 h-0.5 bg-white/50 rounded-full" aria-hidden />
    </div>
  );
}

/**
 * Single layout for all pages under it. Applies the same gradient hero on every page;
 * hero content is from route config (title + subtitle) or custom from usePageHero (e.g. Profile).
 */
export default function MainLayout() {
  const { pathname } = useLocation();
  const customHero = usePageLayoutHero();
  const config = LAYOUT_HERO[pathname];

  const heroContent = customHero ?? (config && <DefaultHeroContent title={config.title} subtitle={config.subtitle} />);
  const hero = heroContent ? (
    <div className={HERO_GRADIENT_CLASSES}>
      {heroContent}
    </div>
  ) : null;

  return (
    <PageLayout hero={hero}>
      <Outlet />
    </PageLayout>
  );
}
