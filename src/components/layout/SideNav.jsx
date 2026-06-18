import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import { NAV_ITEMS } from '../../constants';

export default function SideNav() {
  return (
    <nav className="hidden md:flex flex-col h-screen py-lg w-[240px] fixed start-0 top-0 border-s border-outline-variant bg-surface-container-low z-50">
      <div className="px-lg mb-xl">
        <div className="flex items-center gap-md">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shadow-md shadow-primary/20">
            <Icon name="smartphone" className="text-[22px]" />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary leading-tight">סלולריום</h1>
            <p className="font-body-sm text-body-sm text-secondary">ניהול חנות סלולר</p>
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-1 px-sm flex-grow">
        {NAV_ITEMS.map(({ path, icon, label }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-md px-md py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-primary font-bold bg-primary/10 shadow-sm'
                    : 'text-secondary hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    <Icon name={icon} filled={isActive} className="text-[20px]" />
                  </div>
                  <span className="font-label-lg text-label-lg">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="px-sm mt-auto">
        <div className="mt-lg px-md flex items-center gap-md border-t border-outline-variant pt-lg">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-container to-primary-container/30 flex items-center justify-center font-label-lg text-primary">
            PS
          </div>
          <div>
            <p className="font-title-sm text-title-sm">סלולריום</p>
            <p className="font-body-sm text-body-sm text-secondary">מערכת POS</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
