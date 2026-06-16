import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Icon from '../ui/Icon';
import { MOBILE_PRIMARY_NAV, MOBILE_MORE_NAV } from '../../constants';

function NavItem({ path, icon, label, end }) {
  return (
    <NavLink
      to={path}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 rounded-xl transition-all duration-200 ${
          isActive ? 'text-primary bg-primary/10' : 'text-secondary hover:text-primary active:scale-95'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} filled={isActive} className={`text-[22px] ${isActive ? 'text-primary' : ''}`} />
          <span className="font-label-md text-[10px] leading-tight truncate w-full text-center">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const moreActive = MOBILE_MORE_NAV.some((item) => item.path === location.pathname);

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-inverse-surface/30 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
          aria-label="סגור תפריט"
        />
      )}

      <div className="fixed bottom-0 inset-x-0 z-[70] md:hidden">
        {moreOpen && (
          <div className="mx-3 mb-2 rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
              <p className="font-label-md text-secondary">עוד אפשרויות</p>
            </div>
            <ul className="p-2">
              {MOBILE_MORE_NAV.map(({ path, icon, label }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container-low'
                      }`
                    }
                  >
                    <Icon name={icon} className="text-[22px]" />
                    <span className="font-body-sm">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav
          className="mobile-nav-bar mx-2 mb-2 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
          aria-label="ניווט ראשי"
        >
          <ul className="flex items-stretch h-[64px] px-1">
            {MOBILE_PRIMARY_NAV.map(({ path, icon, label }) => (
              <li key={path} className="flex flex-1 min-w-0">
                <NavItem path={path} icon={icon} label={label} end={path === '/'} />
              </li>
            ))}
            <li className="flex flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 px-1 rounded-xl transition-all ${
                  moreOpen || moreActive ? 'text-primary bg-primary/10' : 'text-secondary hover:text-primary active:scale-95'
                }`}
              >
                <Icon name="more_horiz" filled={moreOpen || moreActive} className="text-[22px]" />
                <span className="font-label-md text-[10px]">עוד</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
