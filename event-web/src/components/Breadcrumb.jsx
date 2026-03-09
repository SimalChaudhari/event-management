import { Link, useLocation } from 'react-router-dom';
import { getBreadcrumbs } from '../routes/routeConfig';

export default function Breadcrumb() {
  const { pathname } = useLocation();
  const items = getBreadcrumbs(pathname);

  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 md:mb-6">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-600">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.path + i} className="flex items-center gap-x-1.5">
              {i > 0 && (
                <span className="text-slate-400 select-none" aria-hidden>
                  /
                </span>
              )}
              {isLast ? (
                <span className="font-medium text-slate-800 truncate">{item.label}</span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-primary transition-colors truncate"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
