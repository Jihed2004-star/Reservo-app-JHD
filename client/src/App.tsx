import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
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

function App() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register';
  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 antialiased">
      {!hideNavbar && <Navbar />}

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
      </Routes>
    </div>
  );
}

export default App;
