import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useSidebar } from './context/SidebarContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Categories from './pages/Categories';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import ElementDetail from './pages/ElementDetail';
import MyBookings from './pages/MyBookings';
import ProviderDashboard from './pages/ProviderDashboard';
import CreateService from './pages/CreateService';
import ManageService from './pages/ManageService';
import ManageElement from './pages/ManageElement';
import UserManagement from './pages/UserManagement';
import CategoryManagement from './pages/CategoryManagement';
import Profile from './pages/Profile';

function App() {
  const { user } = useAuth();
  const { isOpen } = useSidebar();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const showSidebar = !!user && !isAuthPage;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {showSidebar && <Sidebar />}

      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${
          showSidebar ? (isOpen ? 'md:pl-64' : 'md:pl-20') : ''
        }`}
      >
        {!isAuthPage && <Navbar />}

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:categoryId/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/elements/:id" element={<ElementDetail />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/provider/dashboard" element={<ProviderDashboard />} />
            <Route path="/provider/services/new" element={<CreateService />} />
            <Route path="/provider/services/:id" element={<ManageService />} />
            <Route path="/provider/elements/:id" element={<ManageElement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/categories" element={<CategoryManagement />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;

