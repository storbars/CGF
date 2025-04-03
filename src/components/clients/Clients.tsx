import React, { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { supabase } from '../../lib/supabase';
import { Plus, RefreshCw, Building2, Mail, Phone, MapPin, Pencil, Trash2, X, Save, Globe, FileText } from 'lucide-react';

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
  _count?: {
    customer_quotes: number;
  };
}

const ClientForm = React.memo(({ client, onChange }: { 
  client: Partial<Client>, 
  onChange: (updates: Partial<Client>) => void 
}) => {
  const debouncedOnChange = React.useMemo(
    () => debounce((updates: Partial<Client>) => {
      onChange(updates);
    }, 100),
    [onChange]
  );

  React.useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleInputChange = (field: keyof Client, value: string) => {
    debouncedOnChange({ ...client, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Contact Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          defaultValue={client.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          defaultValue={client.company_name}
          onChange={(e) => handleInputChange('company_name', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          defaultValue={client.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="tel"
          defaultValue={client.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Website
        </label>
        <input
          type="url"
          defaultValue={client.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="https://"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Country
        </label>
        <input
          type="text"
          defaultValue={client.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Street Address Line 1
        </label>
        <input
          type="text"
          defaultValue={client.street_address_1}
          onChange={(e) => handleInputChange('street_address_1', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Street Address Line 2
        </label>
        <input
          type="text"
          defaultValue={client.street_address_2}
          onChange={(e) => handleInputChange('street_address_2', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Place
        </label>
        <input
          type="text"
          defaultValue={client.place}
          onChange={(e) => handleInputChange('place', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          ZIP Code
        </label>
        <input
          type="text"
          defaultValue={client.zipcode}
          onChange={(e) => handleInputChange('zipcode', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700">
          Internal Notes
        </label>
        <textarea
          defaultValue={client.internal_notes}
          onChange={(e) => handleInputChange('internal_notes', e.target.value)}
          rows={4}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Add internal notes about this client..."
        />
      </div>
    </div>
  );
});

ClientForm.displayName = 'ClientForm';

function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    company_name: '',
    phone: '',
    street_address_1: '',
    street_address_2: '',
    country: '',
    zipcode: '',
    place: '',
    website: '',
    internal_notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          customer_quotes (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      setError('Failed to load clients');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (client: Partial<Client>) => {
    try {
      setLoading(true);
      setError(null);

      if (!client.name?.trim()) {
        throw new Error('Name is required');
      }

      if (!client.email?.trim()) {
        throw new Error('Email is required');
      }

      if (!client.company_name?.trim()) {
        throw new Error('Company name is required');
      }

      const clientData = {
        name: client.name,
        email: client.email,
        company_name: client.company_name,
        phone: client.phone,
        street_address_1: client.street_address_1,
        street_address_2: client.street_address_2,
        country: client.country,
        zipcode: client.zipcode,
        place: client.place,
        website: client.website,
        internal_notes: client.internal_notes,
      };

      if (client.id) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData]);

        if (error) throw error;
      }

      await fetchClients();
      setEditingClient(null);
      setIsAdding(false);
      setNewClient({
        name: '',
        email: '',
        company_name: '',
        phone: '',
        street_address_1: '',
        street_address_2: '',
        country: '',
        zipcode: '',
        place: '',
        website: '',
        internal_notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchClients();
    } catch (err) {
      setError('Failed to delete client');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = React.useCallback((updates: Partial<Client>) => {
    if (editingClient) {
      setEditingClient(prev => ({ ...prev!, ...updates }));
    } else {
      setNewClient(prev => ({ ...prev, ...updates }));
    }
  }, [editingClient]);

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">Add New Client</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ClientForm client={newClient} onChange={handleClientChange} />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsAdding(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(newClient)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quotes
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12">
                  <div className="text-center">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding a new client.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Client
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr 
                  key={client.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {client.company_name}
                      </div>
                      {client.website && (
                        <a
                          href={client.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          {client.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                      {client.internal_notes && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <FileText className="h-3 w-3 mr-1" />
                            Has notes
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {client.name}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-1" />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Phone className="h-4 w-4 mr-1" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {client.street_address_1 && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <div>
                            <div>{client.street_address_1}</div>
                            {client.street_address_2 && <div>{client.street_address_2}</div>}
                            <div>
                              {client.zipcode && `${client.zipcode} `}
                              {client.place}
                            </div>
                            {client.country && <div>{client.country}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client._count?.customer_quotes || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingClient(client)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingClient && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Client</h3>
              <button
                onClick={() => setEditingClient(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ClientForm client={editingClient} onChange={handleClientChange} />

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingClient(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(editingClient)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;