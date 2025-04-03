import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Globe, FileText, Pencil, RefreshCw } from 'lucide-react';
import { formatPrice } from '../../lib/currencies';

interface Client {
  id: string;
  name: string;
  email: string;
  company_name: string;
  phone?: string;
  street_address_1?: string;
  street_address_2?: string;
  country?: string;
  zipcode?: string;
  place?: string;
  website?: string;
  internal_notes?: string;
  created_at: string;
}

interface Quote {
  id: string;
  form_id: string;
  customer_email: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  total_price: number;
  created_at: string;
  quote_forms: {
    title: string;
    description?: string;
  };
}

function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientResult, quotesResult] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('customer_quotes')
          .select(`
            *,
            quote_forms (
              title,
              description
            )
          `)
          .eq('client_id', id)
          .order('created_at', { ascending: false })
      ]);

      if (clientResult.error) throw clientResult.error;
      if (quotesResult.error) throw quotesResult.error;

      setClient(clientResult.data);
      setQuotes(quotesResult.data || []);
    } catch (err) {
      setError('Failed to load client data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Client not found</p>
        <button
          onClick={() => navigate('/clients')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Clients
        </button>

        <button
          onClick={() => navigate(`/clients/${id}/edit`)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit Client
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{client.company_name}</h2>
              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  {client.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Contact Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.name}</dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                <Mail className="h-4 w-4 mr-1 text-gray-400" />
                {client.email}
              </dd>
            </div>

            {client.phone && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                  {client.phone}
                </dd>
              </div>
            )}

            {(client.street_address_1 || client.street_address_2 || client.place || client.country) && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-400" />
                    <div>
                      {client.street_address_1 && <div>{client.street_address_1}</div>}
                      {client.street_address_2 && <div>{client.street_address_2}</div>}
                      <div>
                        {client.zipcode && `${client.zipcode} `}
                        {client.place}
                      </div>
                      {client.country && <div>{client.country}</div>}
                    </div>
                  </div>
                </dd>
              </div>
            )}

            {client.internal_notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Internal Notes
                </dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {client.internal_notes}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Quotes</h3>
        </div>
        <div className="border-t border-gray-200">
          {quotes.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes</h3>
              <p className="mt-1 text-sm text-gray-500">
                This client hasn't submitted any quotes yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {quote.quote_forms.title}
                        </div>
                        {quote.quote_forms.description && (
                          <div className="text-sm text-gray-500">
                            {quote.quote_forms.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(quote.total_price, 'USD')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/quote/${quote.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientDetails;