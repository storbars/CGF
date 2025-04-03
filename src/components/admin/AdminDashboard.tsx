import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FileText, Plus, RefreshCw, Users, Building2 } from 'lucide-react';

interface QuoteForm {
  id: string;
  title: string;
  description: string;
  created_at: string;
  _count: {
    customer_quotes: number;
  };
}

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

function AdminDashboard() {
  const [forms, setForms] = useState<QuoteForm[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch quote forms with count of quotes
      const { data: formsData, error: formsError } = await supabase
        .from('quote_forms')
        .select(`
          *,
          customer_quotes (count)
        `)
        .order('created_at', { ascending: false });

      if (formsError) throw formsError;

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setForms(formsData || []);
      setUsers(usersData || []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/form-builder"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Quote Form
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Quote Forms Overview */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Quote Forms</h2>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {forms.map((form) => (
                  <li key={form.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">{form.title}</p>
                        <p className="text-sm text-gray-500">{form.description}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {form._count?.customer_quotes || 0} quotes
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Users Overview */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Users</h2>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          Role: {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="bg-white shadow sm:rounded-lg sm:col-span-2">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">System Overview</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Forms</dt>
                      <dd className="text-lg font-medium text-gray-900">{forms.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{users.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building2 className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Quotes</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {forms.reduce((total, form) => total + (form._count?.customer_quotes || 0), 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;