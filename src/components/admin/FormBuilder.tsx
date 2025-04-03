import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { debounce } from 'lodash';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Save, ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import { FormField } from './form-builder/FormField';
import { FormSettings } from './form-builder/FormSettings';
import { FieldButtons } from './form-builder/FieldButtons';

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

function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showPrices, setShowPrices] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [published, setPublished] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(field => 
        (field.id || fields.indexOf(field).toString()) === active.id
      );
      const newIndex = fields.findIndex(field => 
        (field.id || fields.indexOf(field).toString()) === over.id
      );
      
      moveField(oldIndex, newIndex);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchProducts(),
      id ? fetchFormData() : Promise.resolve()
    ]).finally(() => setLoading(false));
  }, [id]);

  const debouncedSave = debounce(async () => {
    if (!id || !title.trim()) return;
    
    try {
      setSaving(true);

      // Update form details first
      const { error: formError } = await supabase
        .from('quote_forms')
        .update({
          title,
          description,
          show_prices: showPrices,
          slug: slug || null,
        })
        .eq('id', id);

      if (formError) throw formError;

      // Process fields in batches of 5
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < fields.length; i += batchSize) {
        batches.push(fields.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(field => {
          if (field.id) {
            // Update existing field
            return supabase
              .from('form_fields')
              .update({
                ...field,
                form_id: id,
              })
              .eq('id', field.id)
              .select();
          } else {
            // Insert new field
            return supabase
              .from('form_fields')
              .insert({
                ...field,
                form_id: id,
              })
              .select();
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setLastSaved(new Date());
    } catch (err) {
      console.error('Autosave error:', err);
    } finally {
      setSaving(false);
    }
  }, 2000);

  useEffect(() => {
    if (id && title.trim()) {
      debouncedSave();
    }
    return () => {
      debouncedSave.cancel();
    };
  }, [title, description, showPrices, fields, slug]);

  const fetchFormData = async () => {
    try {
      const [formResult, fieldsResult] = await Promise.all([
        supabase
          .from('quote_forms')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('form_fields')
          .select('*')
          .eq('form_id', id)
          .order('order', { ascending: true })
      ]);

      if (formResult.error) throw formResult.error;
      if (fieldsResult.error) throw fieldsResult.error;

      const formData = formResult.data;
      setTitle(formData.title);
      setDescription(formData.description || '');
      setShowPrices(formData.show_prices);
      setSlug(formData.slug || '');
      setPublished(formData.published);
      setFields(fieldsResult.data || []);
    } catch (err) {
      setError('Failed to load form data');
      console.error('Error:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const addField = (type: FormField['type']) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      label: '',
      type,
      required: false,
      price: 0,
      order: fields.length,
    };

    switch (type) {
      case 'header':
        newField.label = 'Section Header';
        newField.content = '';
        break;
      case 'content':
        newField.label = 'Text Block';
        newField.content = '';
        break;
      case 'image':
        newField.label = 'Image';
        newField.image_url = '';
        break;
      case 'product':
        newField.label = 'Product Selection';
        newField.quantity_field = true;
        break;
    }

    setFields(prev => [...prev, newField]);
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(prev => {
      const newFields = [...prev];
      newFields[index] = { ...newFields[index], ...updates };

      if (updates.product_id) {
        const product = products.find(p => p.id === updates.product_id);
        if (product) {
          newFields[index].price = product.price;
          newFields[index].label = product.name;
        }
      }

      return newFields;
    });
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    setFields(prev => {
      const newFields = [...prev];
      const [movedField] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, movedField);
      
      return newFields.map((field, index) => ({
        ...field,
        order: index
      }));
    });
  };

  const handlePreview = () => {
    if (!published || !slug) {
      alert('Please publish the form first to preview it.');
      return;
    }
    window.open(`/forms/${slug}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);

      if (!title.trim()) {
        throw new Error('Title is required');
      }

      if (fields.length === 0) {
        throw new Error('At least one field is required');
      }

      if (id) {
        // Update existing form
        const { error: formError } = await supabase
          .from('quote_forms')
          .update({
            title,
            description,
            show_prices: showPrices,
            slug: slug || null,
          })
          .eq('id', id);

        if (formError) throw formError;

        // Delete existing fields
        const { error: deleteError } = await supabase
          .from('form_fields')
          .delete()
          .eq('form_id', id);

        if (deleteError) throw deleteError;

        // Insert new fields in smaller batches
        const batchSize = 5;
        for (let i = 0; i < fields.length; i += batchSize) {
          const batch = fields.slice(i, i + batchSize).map((field, idx) => ({
            ...field,
            form_id: id,
            order: i + idx,
          }));

          const { error: insertError } = await supabase
            .from('form_fields')
            .insert(batch)
            .select();

          if (insertError) throw insertError;

          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        // Create new form
        const { data: form, error: formError } = await supabase
          .from('quote_forms')
          .insert({
            title,
            description,
            show_prices: showPrices,
            slug: slug || null,
          })
          .select()
          .single();

        if (formError) throw formError;

        // Insert fields in smaller batches
        const batchSize = 5;
        for (let i = 0; i < fields.length; i += batchSize) {
          const batch = fields.slice(i, i + batchSize).map((field, idx) => ({
            ...field,
            form_id: form.id,
            order: i + idx,
          }));

          const { error: insertError } = await supabase
            .from('form_fields')
            .insert(batch)
            .select();

          if (insertError) throw insertError;

          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      navigate('/admin/forms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save form');
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/forms')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Forms
        </button>

        <button
          onClick={handlePreview}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Form
        </button>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {id ? 'Edit Form' : 'Create Form'}
            </h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
                {error}
              </div>
            )}

            <FormSettings
              title={title}
              description={description}
              showPrices={showPrices}
              slug={slug}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onShowPricesChange={setShowPrices}
              onSlugChange={setSlug}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Form Fields</h2>
            </div>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map(f => f.id || fields.indexOf(f).toString())} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id || index}
                      field={field}
                      index={index}
                      products={products}
                      onRemove={removeField}
                      onUpdate={updateField}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {fields.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Plus className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-900">No fields added</p>
                <p className="mt-1 text-sm text-gray-500">
                  Use the buttons below to add form fields
                </p>
              </div>
            )}

            <div className="mt-6">
              <FieldButtons onAddField={addField} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {saving ? (
                <span className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              ) : null}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormBuilder;