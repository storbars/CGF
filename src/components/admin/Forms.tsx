import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, RefreshCw, Globe, FileText, Copy, Building2, Eye } from 'lucide-react';

interface QuoteForm {
  id: string;
  title: string;
  description: string;
  created_at: string;
  published: boolean;
  slug: string | null;
  client_id: string | null;
  clients?: {
    company_name: string;
  } | null;
  _count: {
    customer_quotes: number;
  };
}

function Forms() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<QuoteForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quote_forms')
        .select(`
          *,
          clients (
            company_name
          ),
          customer_quotes (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (err) {
      setError('Failed to load forms');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (formId: string, currentSlug: string | null) => {
    try {
      setPublishing(formId);
      let slug = currentSlug;

      if (!slug) {
        const input = prompt('Enter a URL-friendly slug for this form:');
        if (!input) return;

        slug = input
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const { error: updateError } = await supabase
          .from('quote_forms')
          .update({ slug, published: true })
          .eq('id', formId);

        if (updateError) throw updateError;
      }

      const { error: publishError } = await supabase
        .from('quote_forms')
        .update({ published: true })
        .eq('id', formId);

      if (publishError) throw publishError;

      await fetchForms();
    } catch (err) {
      setError('Failed to publish form');
      console.error('Error:', err);
    } finally {
      setPublishing(null);
    }
  };

  const handleDuplicate = async (formId: string) => {
    try {
      setDuplicating(formId);

      const { data, error } = await supabase
        .rpc('duplicate_quote_form', { form_id: formId });

      if (error) throw error;

      navigate(`/admin/form-builder/${data}`);
    } catch (err) {
      setError('Failed to duplicate form');
      console.error('Error:', err);
    } finally {
      setDuplicating(null);
    }
  };

  const handlePreview = (form: QuoteForm) => {
    if (form.published && form.slug) {
      window.open(`/forms/${form.slug}`, '_blank');
    } else {
      alert('Please publish the form first to preview it.');
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
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/form-builder"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Form
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Forms Overview */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Forms</h2>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {forms.slice(0, 5).map((form) => (
                  <li 
                    key={form.id} 
                    className="py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/admin/form-builder/${form.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">{form.title}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{form.description}</p>
                        {form.clients?.company_name && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                            <Building2 className="h-3 w-3 mr-1" />
                            {form.clients.company_name}
                          </span>
                        )}
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

        {/* Quick Stats */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
            <dl className="grid grid-cols-1 gap-5">
              <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Total Forms</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{forms.length}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Published Forms</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {forms.filter(form => form.published).length}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:p-6 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Total Quotes</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {forms.reduce((total, form) => total + (form._count?.customer_quotes || 0), 0)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Form
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quotes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {forms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No forms</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new form.
                    </p>
                    <div className="mt-6">
                      <Link
                        to="/admin/form-builder"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Form
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              forms.map((form) => (
                <tr 
                  key={form.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/form-builder/${form.id}`)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{form.title}</div>
                      {form.published && form.slug && (
                        <div className="mt-1">
                          <a
                            href={`/forms/${form.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            /forms/{form.slug}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {form.clients?.company_name ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Building2 className="h-3 w-3 mr-1" />
                        {form.clients.company_name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Open</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      form.published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {form.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {form._count?.customer_quotes || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(form.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(form);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(form.id);
                        }}
                        disabled={duplicating === form.id}
                        className={`text-gray-600 hover:text-gray-900 ${
                          duplicating === form.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {duplicating === form.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublish(form.id, form.slug);
                        }}
                        disabled={publishing === form.id}
                        className={`text-green-600 hover:text-green-900 ${
                          publishing === form.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {publishing === form.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Forms;