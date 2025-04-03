import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, RefreshCw, Save, Upload, X } from 'lucide-react';
import { currencies, formatPrice, type CurrencyCode } from '../../lib/currencies';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  'Brand Awareness',
  'Business Development',
  'Marketing Services',
  'Web Services'
];

function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    category: 'Marketing Services',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (product: Partial<Product>) => {
    try {
      setLoading(true);
      setError(null);

      if (!product.name?.trim()) {
        throw new Error('Product name is required');
      }

      if (!product.category) {
        throw new Error('Category is required');
      }

      if (!product.currency) {
        throw new Error('Currency is required');
      }

      if (product.id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            category: product.category,
          })
          .eq('id', product.id);

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([{
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            category: product.category,
          }]);

        if (error) throw error;
      }

      await fetchProducts();
      setEditingProduct(null);
      setIsAdding(false);
      setNewProduct({ 
        name: '', 
        description: '', 
        price: 0,
        currency: 'USD',
        category: 'Marketing Services' 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProducts();
    } catch (err) {
      setError('Failed to delete product');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    try {
      setImportError(null);
      setLoading(true);

      // Split into lines and remove empty lines
      const lines = bulkData
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        throw new Error('No data found. Please check the format.');
      }

      // Skip header row if it exists (check if first row contains headers)
      const startIndex = lines[0].toLowerCase().includes('name') || 
                        lines[0].toLowerCase().includes('description') ? 1 : 0;

      // Parse remaining rows
      const rows = lines
        .slice(startIndex)
        .map(line => line.split(',').map(cell => cell.trim()));

      if (rows.length === 0) {
        throw new Error('No valid data found. Please check the format.');
      }

      const validationErrors: string[] = [];
      const validProducts: any[] = [];

      rows.forEach((row, index) => {
        const lineNumber = startIndex + index + 1;

        // Ensure we have all required fields
        if (row.length < 5) {
          validationErrors.push(`Line ${lineNumber}: Missing fields. Expected: name, description, price, currency, category`);
          return;
        }

        const [name, description, price, currency, category] = row;

        // Validate name
        if (!name.trim()) {
          validationErrors.push(`Line ${lineNumber}: Product name is required`);
          return;
        }

        // Validate price
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          validationErrors.push(`Line ${lineNumber}: Invalid price "${price}". Must be a positive number`);
          return;
        }

        // Validate currency
        if (!Object.keys(currencies).includes(currency)) {
          validationErrors.push(`Line ${lineNumber}: Invalid currency "${currency}". Must be one of: ${Object.keys(currencies).join(', ')}`);
          return;
        }

        // Validate category
        if (!CATEGORIES.includes(category)) {
          validationErrors.push(`Line ${lineNumber}: Invalid category "${category}". Must be one of: ${CATEGORIES.join(', ')}`);
          return;
        }

        validProducts.push({
          name,
          description: description || '',
          price: parsedPrice,
          currency: currency as CurrencyCode,
          category,
        });
      });

      if (validationErrors.length > 0) {
        throw new Error('Validation errors:\n' + validationErrors.join('\n'));
      }

      // Insert products
      const { error } = await supabase
        .from('products')
        .insert(validProducts);

      if (error) throw error;

      await fetchProducts();
      setIsBulkImporting(false);
      setBulkData('');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import products');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Products</h2>
        <div className="mt-3 sm:mt-0 space-x-3">
          <button
            onClick={() => setIsBulkImporting(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {isBulkImporting && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Bulk Import Products</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Paste your CSV data below. Format: name, description, price, currency, category
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Example: Product Name, Product Description, 99.99, USD, Marketing Services
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Valid currencies: {Object.keys(currencies).join(', ')}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Valid categories: {CATEGORIES.join(', ')}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsBulkImporting(false);
                  setBulkData('');
                  setImportError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative whitespace-pre-wrap">
                {importError}
              </div>
            )}

            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              rows={10}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
              placeholder="Product Name, Product Description, 99.99, USD, Marketing Services"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsBulkImporting(false);
                  setBulkData('');
                  setImportError(null);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!bulkData.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Products
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={newProduct.currency}
                  onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value as CurrencyCode })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {Object.entries(currencies).map(([code, { name }]) => (
                    <option key={code} value={code}>
                      {code} - {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsAdding(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(newProduct)}
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {editingProduct?.id === product.id ? (
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    product.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingProduct?.id === product.id ? (
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {editingProduct?.id === product.id ? (
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      rows={2}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  ) : (
                    product.description
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingProduct?.id === product.id ? (
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                        min="0"
                        step="0.01"
                        className="block w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <select
                        value={editingProduct.currency}
                        onChange={(e) => setEditingProduct({ ...editingProduct, currency: e.target.value as CurrencyCode })}
                        className="block w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {Object.keys(currencies).map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    formatPrice(product.price, product.currency)
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingProduct?.id === product.id ? (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(editingProduct)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductManager;