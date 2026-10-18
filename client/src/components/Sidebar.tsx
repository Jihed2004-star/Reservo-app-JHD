import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Statusopen from './ui/statusopen';
import Statusclose from './ui/statusclose';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebar();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (!user || isAuthPage) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 bottom-0 z-40 h-screen transition-all duration-300 ease-in-out">
      {isOpen ? (
        <Statusopen onToggleCollapse={() => setIsOpen(false)} />
      ) : (
        <Statusclose onToggleExpand={() => setIsOpen(true)} />
      )}
    </div>
  );
}
