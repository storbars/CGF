import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth';
import { FileText, Plus, RefreshCw } from 'lucide-react';

interface QuoteForm {
  id: string;
  title: string;
  description: string;
}

interface CustomerQuote {
  id: string;
  form_id: string;
  customer_email: string;
  company_name: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  total_price: number;
  created_at: string;
  quote_forms: QuoteForm;
}

function Dashboard() {
  const [quotes, setQuotes] = useState<CustomerQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_quotes')
        .select(`
          *,
          quote_forms (
            id,
            title,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (err) {
      setError('Failed to load quotes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Quote Dashboard</h1>
        {user?.role === 'admin' && (
          <Link
            to="/admin/form-builder"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Quote Form
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {quotes.length === 0 ? (
            <li className="px-6 py-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new quote form.
                </p>
                {user?.role === 'admin' && (
                  <div className="mt-6">
                    <Link
                      to="/admin/form-builder"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Quote Form
                    </Link>
                  </div>
                )}
              </div>
            </li>
          ) : (
            quotes.map((quote) => (
              <li key={quote.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {quote.quote_forms.title}
                      </p>
                      <div className="ml-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <p>{quote.company_name}</p>
                        <span className="mx-2">•</span>
                        <p>{quote.customer_email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900">
                      ${quote.total_price.toFixed(2)}
                    </span>
                    <Link
                      to={`/quote/${quote.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;