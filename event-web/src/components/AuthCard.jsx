export default function AuthCard({ children, className = '', noCardOnMobile = false }) {
  return (
    <div
      className={`fixed left-0 right-0 flex items-center justify-center p-4 z-0 ${
        noCardOnMobile ? 'top-0 bottom-0 md:top-14' : 'top-14 bottom-0'
      }`}
    >
      <div
        className={`w-full max-w-md p-6 md:p-8 ${
          noCardOnMobile
            ? 'md:bg-white md:rounded-2xl md:shadow-lg md:border md:border-slate-200'
            : 'bg-white rounded-2xl shadow-lg border border-slate-200'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
