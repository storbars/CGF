/*
  # Add image support for products and link products to form fields

  1. Changes
    - Add image_url column to products table
    - Add product_id to form_fields table (already exists)
    - Add quantity_field to form_fields table (already exists)

  2. Notes
    - image_url is optional and can store URLs to external image hosting services
    - product_id links a form field to a specific product for pricing
    - quantity_field indicates if the field should show a quantity input
*/

-- Add image_url column to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS image_url text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_fields_product_id ON form_fields(product_id);