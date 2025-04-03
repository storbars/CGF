import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Type, FileText, ImageIcon, Package, Search } from 'lucide-react';
import { formatPrice, type CurrencyCode } from '../../../lib/currencies';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  category: string;
  image_url?: string;
}

interface FormField {
  id?: string;
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

interface FormFieldProps {
  field: FormField;
  index: number;
  products: Product[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<FormField>) => void;
}

export function FormField({ field, index, products, onRemove, onUpdate }: FormFieldProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id || index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const selectedProduct = field.product_id ? products.find(p => p.id === field.product_id) : null;

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Only show required checkbox for input fields
  const canBeRequired = ['text', 'number', 'checkbox', 'select', 'textarea'].includes(field.type);

  const renderFieldEditor = () => {
    switch (field.type) {
      case 'header':
      case 'content':
        return (
          <div className="flex-grow">
            <input
              type="text"
              value={field.content || ''}
              onChange={(e) => onUpdate(index, { content: e.target.value })}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder={field.type === 'header' ? 'Enter header text' : 'Enter content text'}
            />
          </div>
        );

      case 'image':
        return (
          <div className="flex-grow">
            <input
              type="url"
              value={field.image_url || ''}
              onChange={(e) => onUpdate(index, { image_url: e.target.value })}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        );

      case 'product':
        return (
          <div className="flex-grow flex items-center space-x-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder={selectedProduct?.name || "Search products..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearching(true);
                }}
                onFocus={() => setIsSearching(true)}
                className="block w-full pr-8 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <Search className="absolute right-2 top-1.5 h-4 w-4 text-gray-400" />
              
              {isSearching && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-48 rounded-md py-1 text-sm overflow-auto focus:outline-none border border-gray-200">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        onUpdate(index, { 
                          product_id: product.id,
                          label: product.name,
                          price: product.price
                        });
                        setIsSearching(false);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt=""
                            className="h-6 w-6 object-cover rounded mr-2"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(product.price, product.currency)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="px-3 py-1.5 text-sm text-gray-500">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <label className="flex items-center whitespace-nowrap text-sm">
              <input
                type="checkbox"
                checked={field.quantity_field}
                onChange={(e) => onUpdate(index, { quantity_field: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-1.5"
              />
              Qty
            </label>
          </div>
        );

      default:
        return (
          <div className="flex-grow flex items-center space-x-2">
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate(index, { label: e.target.value })}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Field label"
            />
            <select
              value={field.type}
              onChange={(e) => onUpdate(index, { type: e.target.value as FormField['type'] })}
              className="block w-32 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="textarea">Text Area</option>
              <option value="checkbox">Checkbox</option>
              <option value="select">Select</option>
            </select>
          </div>
        );
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 py-2 px-3 rounded border border-gray-200"
    >
      <div className="flex items-center space-x-2">
        <div 
          {...attributes}
          {...listeners}
          className="cursor-move"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        
        {field.type === 'header' && <Type className="h-4 w-4 text-gray-400" />}
        {field.type === 'content' && <FileText className="h-4 w-4 text-gray-400" />}
        {field.type === 'image' && <ImageIcon className="h-4 w-4 text-gray-400" />}
        {field.type === 'product' && <Package className="h-4 w-4 text-gray-400" />}
        
        {renderFieldEditor()}

        <div className="flex items-center space-x-2 ml-2">
          {canBeRequired && (
            <label className="flex items-center whitespace-nowrap text-sm">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate(index, { required: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-1.5"
              />
              Req
            </label>
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-700 p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}