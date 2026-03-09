/**
 * Skip link for keyboard/screen-reader users. Visible on focus only.
 * Place once at the top of the page; main content must have id="main-content".
 */
export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:[clip:auto] focus:bg-[#71C0BB] focus:text-white focus:rounded-lg focus:font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#71C0BB]"
    >
      Skip to main content
    </a>
  );
}
