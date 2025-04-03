import React from 'react';
import { Eye, EyeOff, LinkIcon } from 'lucide-react';

interface FormSettingsProps {
  title: string;
  description: string;
  showPrices: boolean;
  slug: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onShowPricesChange: (value: boolean) => void;
  onSlugChange: (value: string) => void;
}

export function FormSettings({
  title,
  description,
  showPrices,
  slug,
  onTitleChange,
  onDescriptionChange,
  onShowPricesChange,
  onSlugChange,
}: FormSettingsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Form Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center">
            <LinkIcon className="h-4 w-4 mr-1" />
            URL Slug
          </div>
        </label>
        <div className="mt-1">
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="your-form-url"
          />
          <p className="mt-1 text-sm text-gray-500">
            This will be used for the public form URL: /forms/{slug || 'your-form-url'}
          </p>
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showPrices}
            onChange={(e) => onShowPricesChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700 flex items-center">
            Show prices to users
            {showPrices ? (
              <Eye className="h-4 w-4 ml-1 text-gray-400" />
            ) : (
              <EyeOff className="h-4 w-4 ml-1 text-gray-400" />
            )}
          </span>
        </label>
        <p className="mt-1 text-sm text-gray-500">
          When disabled, prices will be hidden until the quote is submitted
        </p>
      </div>
    </div>
  );
}