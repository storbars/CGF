/*
  # Update form fields to support new field types

  1. Changes
    - Add new field types to form_fields table constraint
    - Add image_url column for image fields
    - Add content column for header/text content

  2. Notes
    - New field types: header, text, image, product
    - Content column stores text for header and text blocks
    - Image_url stores the URL for image fields
*/

-- Add new columns
ALTER TABLE form_fields
ADD COLUMN IF NOT EXISTS content text,
ADD COLUMN IF NOT EXISTS image_url text;

-- Drop existing type constraint
ALTER TABLE form_fields 
DROP CONSTRAINT IF EXISTS valid_type;

-- Add updated type constraint
ALTER TABLE form_fields
ADD CONSTRAINT valid_type CHECK (
  type = ANY (ARRAY[
    'text'::text,
    'number'::text,
    'checkbox'::text,
    'select'::text,
    'textarea'::text,
    'header'::text,
    'content'::text,
    'image'::text,
    'product'::text
  ])
);