
import React, { PropsWithChildren } from 'react';
// Fix: Use namespaced import to resolve 'no exported member' errors in certain TS environments
import * as reactRouterDom from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout'; // New Admin Layout
import StudentPortal from './pages/StudentPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminStructure from './pages/AdminStructure';
import AdminManagement from './pages/AdminManagement'; // New page
import HomeSelection from './pages/HomeSelection';

const { HashRouter, Routes, Route, Navigate, useLocation } = reactRouterDom as any;
const Router = HashRouter;

// Protected Route Component
const ProtectedRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes with Standard Layout */}
        <Route path="/" element={<Layout><HomeSelection /></Layout>} />
        <Route path="/student" element={<Layout><StudentPortal /></Layout>} />
        
        {/* Admin Login (No Layout) */}
        <Route path="/admin" element={<AdminLogin />} />
        
        {/* Protected Admin Routes with Admin Layout */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/structure" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminStructure />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/team" 
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminManagement />
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Redirects */}
        <Route path="/admin/timetable" element={<Navigate to="/admin/structure" replace />} />
        <Route path="/admin/instructors" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
