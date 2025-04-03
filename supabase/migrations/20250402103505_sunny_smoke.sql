/*
  # Remove categories table and update products constraints

  1. Changes
    - Drop the categories table as it's redundant
    - Ensure products table has proper category constraints
    - Keep existing category values and constraints

  2. Notes
    - No data loss as categories are enforced via CHECK constraint
    - Maintains existing product categorization
*/

-- Drop the categories table if it exists
DROP TABLE IF EXISTS categories;

-- Ensure products table has the correct category constraints
DO $$ 
BEGIN 
  -- Drop existing category constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'products' AND constraint_name = 'products_category_check'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_category_check;
  END IF;

  -- Add the check constraint back
  ALTER TABLE products
    ADD CONSTRAINT products_category_check 
    CHECK (category IN ('Brand Awareness', 'Business Development', 'Marketing Services', 'Web Services'));
END $$;