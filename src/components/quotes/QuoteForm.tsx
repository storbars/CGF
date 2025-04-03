import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { RefreshCw, ArrowLeft, Send, Eye, EyeOff } from 'lucide-react';
import { formatPrice } from '../../lib/currencies';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'select' | 'textarea';
  options?: { label: string; value: string }[];
  required: boolean;
  price: number;
  order: number;
  product_id?: string;
  quantity_field?: boolean;
}

interface QuoteFormData {
  id: string;
  title: string;
  description: string;
  created_by: string;
  show_prices: boolean;
}

interface QuoteResponse {
  field_id: string;
  value: string;
}

function QuoteForm() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<QuoteFormData | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [showPrices, setShowPrices] = useState(false);

  useEffect(() => {
    fetchFormData();
  }, [formId]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const { data: formData, error: formError } = await supabase
        .from('quote_forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (formError) throw formError;

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('order', { ascending: true });

      if (fieldsError) throw fieldsError;

      setForm(formData);
      setFields(fieldsData || []);
      setShowPrices(formData.show_prices);
    } catch (err) {
      setError('Failed to load form data');
      console.error('Error:', err);
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
      if (field.type === 'number') {
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
          form_id: formId,
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

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quote');
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Form not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
      </div>

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
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                    {showPrices && field.price > 0 && (
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
              ))}
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-medium text-gray-900">
                    {showPrices ? (
                      <>
                        Total: {formatPrice(calculateTotalPrice(), 'USD')}
                        <Eye className="inline-block h-4 w-4 ml-2 text-gray-400" />
                      </>
                    ) : (
                      <>
                        Prices hidden
                        <EyeOff className="inline-block h-4 w-4 ml-2 text-gray-400" />
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Submit Quote
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default QuoteForm;