import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { Building2, FileText, LogOut, Package, User, Users, FormInput } from 'lucide-react';

function Layout() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) ? 
      "border-b-2 border-blue-500 text-blue-600" : 
      "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/dashboard" className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">CometGrowth Flow</span>
              </Link>
              
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/dashboard')}`}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Quotes
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin/forms"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/admin/forms')}`}
                  >
                    <FormInput className="h-4 w-4 mr-1" />
                    Forms
                  </Link>
                )}

                <Link
                  to="/clients"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/clients')}`}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Clients
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin/products"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${isActive('/admin/products')}`}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Products
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <Link
                to={user?.role === 'admin' ? '/admin' : '/profile'}
                className="flex items-center text-sm text-gray-700 hover:text-gray-900 mr-4"
              >
                <User className="h-4 w-4 mr-1" />
                {user?.email}
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;