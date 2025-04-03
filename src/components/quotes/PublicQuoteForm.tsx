import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { RefreshCw } from 'lucide-react';
import { formatPrice } from '../../lib/currencies';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'select' | 'textarea' | 'header' | 'content' | 'image' | 'product';
  options?: { label: string; value: string }[];
  required: boolean;
  price: number;
  order: number;
  product_id?: string;
  quantity_field?: boolean;
  content?: string;
  image_url?: string;
}

interface QuoteForm {
  id: string;
  title: string;
  description: string;
  show_prices: boolean;
  published: boolean;
}

function PublicQuoteForm() {
  const { slug } = useParams();
  const [form, setForm] = useState<QuoteForm | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    fetchFormData();
  }, [slug]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      
      // First check if the form exists and is published
      const { data: formData, error: formError } = await supabase
        .from('quote_forms')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (formError) throw formError;
      if (!formData) {
        setForm(null);
        return;
      }

      // Then fetch the form fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formData.id)
        .order('order', { ascending: true });

      if (fieldsError) throw fieldsError;

      setForm(formData);
      setFields(fieldsData || []);
    } catch (err) {
      console.error('Error fetching form:', err);
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const calculateTotalPrice = () => {
    return fields.reduce((total, field) => {
      if (field.type === 'checkbox' && responses[field.id] === 'true') {
        return total + (field.price || 0);
      }
      if (field.type === 'number' && field.quantity_field) {
        const quantity = parseInt(responses[field.id] || '0', 10);
        return total + (field.price || 0) * quantity;
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (!form) return;

      // Validate required fields
      const missingRequired = fields
        .filter(field => field.required)
        .some(field => !responses[field.id]);

      if (missingRequired) {
        throw new Error('Please fill in all required fields');
      }

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('customer_quotes')
        .insert({
          form_id: form.id,
          customer_email: customerEmail,
          company_name: companyName,
          total_price: calculateTotalPrice(),
          status: 'draft'
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create responses
      const quoteResponses = Object.entries(responses).map(([fieldId, value]) => ({
        quote_id: quote.id,
        field_id: fieldId,
        value: value.toString()
      }));

      const { error: responsesError } = await supabase
        .from('quote_responses')
        .insert(quoteResponses);

      if (responsesError) throw responsesError;

      // Show success message
      alert('Quote submitted successfully!');
      
      // Reset form
      setResponses({});
      setCompanyName('');
      setCustomerEmail('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quote');
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Form Not Found</h1>
          <p className="text-gray-600">
            The form you're looking for doesn't exist or hasn't been published yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600 mb-6">{form.description}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="company"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {fields.map((field) => {
                  switch (field.type) {
                    case 'header':
                      return (
                        <div key={field.id} className="border-b border-gray-200 pb-4">
                          <h2 className="text-xl font-semibold text-gray-900">
                            {field.content}
                          </h2>
                        </div>
                      );

                    case 'content':
                      return (
                        <div key={field.id} className="prose prose-blue max-w-none">
                          {field.content}
                        </div>
                      );

                    case 'image':
                      return (
                        <div key={field.id} className="aspect-w-16 aspect-h-9">
                          <img
                            src={field.image_url}
                            alt={field.label}
                            className="object-cover rounded-lg"
                          />
                        </div>
                      );

                    default:
                      return (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                            {form.show_prices && field.price > 0 && (
                              <span className="ml-2 text-gray-500">
                                ({formatPrice(field.price, 'USD')})
                              </span>
                            )}
                          </label>

                          <div className="mt-1">
                            {field.type === 'text' && (
                              <input
                                type="text"
                                value={responses[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                required={field.required}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            )}

                            {field.type === 'number' && (
                              <input
                                type="number"
                                min="0"
                                value={responses[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                required={field.required}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            )}

                            {field.type === 'textarea' && (
                              <textarea
                                value={responses[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                required={field.required}
                                rows={4}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            )}

                            {field.type === 'checkbox' && (
                              <input
                                type="checkbox"
                                checked={responses[field.id] === 'true'}
                                onChange={(e) => handleInputChange(field.id, e.target.checked.toString())}
                                required={field.required}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            )}

                            {field.type === 'select' && field.options && (
                              <select
                                value={responses[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                required={field.required}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value="">Select an option</option>
                                {field.options.map((option, index) => (
                                  <option key={index} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      );
                  }
                })}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-medium text-gray-900">
                    {form.show_prices ? (
                      <>Total: {formatPrice(calculateTotalPrice(), 'USD')}</>
                    ) : (
                      'Prices will be shown in the quote'
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Quote Request'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicQuoteForm;