import { createContext, useContext, useState, useEffect } from 'react';

const PageLayoutContext = createContext(null);

export function PageLayoutProvider({ children }) {
  const [hero, setHero] = useState(null);

  return (
    <PageLayoutContext.Provider value={{ hero, setHero }}>
      {children}
    </PageLayoutContext.Provider>
  );
}

/**
 * Call this in a page component to set the hero for the shared PageLayout.
 * The hero is cleared when the page unmounts.
 * Pass null to hide the hero.
 */
export function usePageHero(heroContent) {
  const { setHero } = useContext(PageLayoutContext);
  if (!setHero) return;

  useEffect(() => {
    setHero(heroContent ?? null);
    return () => setHero(null);
  }, [heroContent, setHero]);
}

export function usePageLayoutHero() {
  const ctx = useContext(PageLayoutContext);
  return ctx?.hero ?? null;
}
