import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import Layout from './components/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import QuoteForm from './components/quotes/QuoteForm';
import PublicQuoteForm from './components/quotes/PublicQuoteForm';
import AdminDashboard from './components/admin/AdminDashboard';
import Forms from './components/admin/Forms';
import FormBuilder from './components/admin/FormBuilder';
import ProductManager from './components/admin/ProductManager';
import Clients from './components/clients/Clients';
import ClientDetails from './components/clients/ClientDetails';

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function App() {
  const { checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Public form route - must be before private routes */}
        <Route path="/forms/:slug" element={<PublicQuoteForm />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quote/:formId" element={<QuoteForm />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetails />} />
          
          {/* Admin Routes */}
          <Route path="admin" element={
            <PrivateRoute adminOnly>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="admin/forms" element={
            <PrivateRoute adminOnly>
              <Forms />
            </PrivateRoute>
          } />
          <Route path="admin/form-builder" element={
            <PrivateRoute adminOnly>
              <FormBuilder />
            </PrivateRoute>
          } />
          <Route path="admin/form-builder/:id" element={
            <PrivateRoute adminOnly>
              <FormBuilder />
            </PrivateRoute>
          } />
          <Route path="admin/products" element={
            <PrivateRoute adminOnly>
              <ProductManager />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;