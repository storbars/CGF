/*
  # Update products table category field

  1. Changes
    - Modify category column to be text with predefined values
    - Set default category to 'Marketing Services'
    - Add check constraint for valid categories
    - Update existing records to use valid categories

  2. Notes
    - Safe migration that preserves existing data
    - Handles existing constraint gracefully
*/

-- Drop existing constraints if they exist
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_fkey,
  DROP CONSTRAINT IF EXISTS products_category_check;

-- Update the category column to be text with check constraint
ALTER TABLE products
  ALTER COLUMN category TYPE text,
  ALTER COLUMN category SET DEFAULT 'Marketing Services';

-- Add the check constraint
ALTER TABLE products
  ADD CONSTRAINT products_category_check 
    CHECK (category IN ('Brand Awareness', 'Business Development', 'Marketing Services', 'Web Services'));

-- Update any existing products to use Marketing Services as default
UPDATE products 
SET category = 'Marketing Services' 
WHERE category IS NULL OR category NOT IN (
  'Brand Awareness', 
  'Business Development', 
  'Marketing Services', 
  'Web Services'
);