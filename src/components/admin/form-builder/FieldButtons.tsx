import React from 'react';
import { Plus, Type, FileText, ImageIcon, Package } from 'lucide-react';

interface FieldButtonsProps {
  onAddField: (type: string) => void;
}

export function FieldButtons({ onAddField }: FieldButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onAddField('header')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Type className="h-4 w-4 mr-1" />
        Add Header
      </button>
      <button
        type="button"
        onClick={() => onAddField('content')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <FileText className="h-4 w-4 mr-1" />
        Add Text
      </button>
      <button
        type="button"
        onClick={() => onAddField('image')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <ImageIcon className="h-4 w-4 mr-1" />
        Add Image
      </button>
      <button
        type="button"
        onClick={() => onAddField('product')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Package className="h-4 w-4 mr-1" />
        Add Product
      </button>
      <button
        type="button"
        onClick={() => onAddField('text')}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Field
      </button>
    </div>
  );
}