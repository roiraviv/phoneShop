import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import RepairLabPage from './pages/RepairLabPage';
import InventoryPage from './pages/InventoryPage';
import CRMPage from './pages/CRMPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import DesktopOnlyRoute from './components/layout/DesktopOnlyRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="pos" element={<DesktopOnlyRoute><POSPage /></DesktopOnlyRoute>} />
          <Route path="repairs" element={<RepairLabPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="crm" element={<CRMPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
