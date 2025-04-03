/*
  # Add product categories

  1. Changes
    - Add `category` column to `products` table
    - Add check constraint to ensure valid categories
    - Set default category to 'other'

  2. Security
    - No changes to RLS policies needed
*/

ALTER TABLE products 
ADD COLUMN category text NOT NULL DEFAULT 'other'
CHECK (category IN ('electronics', 'software', 'services', 'hardware', 'other'));

-- Update existing products to have a category
UPDATE products SET category = 'other' WHERE category IS NULL;