/**
 * Reusable page layout: one place for top/bottom structure and card behavior.
 * Use this so every page has consistent layout without redefining header/card each time.
 *
 * Usage:
 *   <PageLayout hero={<PageHero title="My Page" subtitle="..." />}>
 *     {pageContent}
 *   </PageLayout>
 *
 *   Or without hero:
 *   <PageLayout>{content}</PageLayout>
 *
 * Props:
 *   - hero: optional React node (e.g. gradient title block), rendered inside card when cardOnDesktop
 *   - cardOnDesktop: wrap hero + children in card (no card on mobile, card on md+). Default true.
 *   - className: optional classes for root wrapper
 *   - children: main content
 */
export default function PageLayout({ children, hero, cardOnDesktop = true, className = '' }) {
  const content = (
    <>
      {hero}
      {children}
    </>
  );

  return (
    <div className={`w-full max-w-full mx-auto ${className}`.trim()}>
      {cardOnDesktop ? (
        <div className="bg-white md:shadow-lg md:border md:border-slate-200 overflow-hidden rounded-none md:rounded-t-2xl md:rounded-b-3xl">
          {content}
        </div>
      ) : (
        content
      )}
    </div>
  );
}
