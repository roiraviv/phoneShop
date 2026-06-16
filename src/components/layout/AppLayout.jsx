import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout() {
  return (
    <div className="h-[100dvh] flex overflow-hidden bg-background">
      <SideNav />
      <div className="flex-1 flex flex-col md:ms-[240px] min-h-0 min-w-0">
        <Outlet />
      </div>
      <MobileBottomNav />
    </div>
  );
}
