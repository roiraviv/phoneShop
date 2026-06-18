import { Navigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function DesktopOnlyRoute({ children }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <Navigate to="/" replace state={{ desktopOnly: 'pos' }} />;
  }

  return children;
}
