import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAdminAuth } from './context/AuthContext';
import Layout         from './components/Layout';

import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import OrdersPage     from './pages/OrdersPage';
import MenuPage       from './pages/MenuPage';
import CouponsPage    from './pages/CouponsPage';
import UsersPage      from './pages/UsersPage';
import AnalyticsPage  from './pages/AnalyticsPage';

/* ---- Protected route wrapper ---- */
function ProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div style={{
        minHeight:      '100vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'var(--cream)',
        flexDirection:  'column',
        gap:            16,
      }}>
        <div style={{ fontSize: '2.5rem' }}>🍛</div>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Loading Navedyam Admin…</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

/* ---- App routes ---- */
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/menu"
        element={
          <ProtectedRoute>
            <MenuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coupons"
        element={
          <ProtectedRoute>
            <CouponsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ---- Root App ---- */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background:   'rgba(255,255,255,0.78)',
              color:        '#1F2433',
              border:       '1px solid rgba(255,255,255,0.7)',
              borderRadius: '10px',
              fontFamily:   "'Nunito Sans', sans-serif",
              fontSize:     '0.875rem',
              fontWeight:   500,
              backdropFilter: 'blur(10px)',
              boxShadow:    '0 10px 28px rgba(17,24,39,0.14)',
            },
            success: {
              iconTheme: { primary: '#17A34A', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#166534', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
