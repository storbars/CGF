/*
  # Simplify product categories

  1. Changes
    - Update products table to use simple text field for categories
    - Add check constraint for valid category values
    - Set default category
    - Update existing products to use valid categories

  2. Security
    - No changes to security policies
*/

-- Drop any existing category-related constraints
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_category_check,
  DROP CONSTRAINT IF EXISTS products_category_fkey;

-- Update the category column to be text with check constraint
ALTER TABLE products
  ALTER COLUMN category TYPE text,
  ALTER COLUMN category SET DEFAULT 'Marketing Services',
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