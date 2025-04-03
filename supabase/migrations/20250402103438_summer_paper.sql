/*
  # Add currency support to products table

  1. Changes
    - Add currency column to products table
    - Set default currency to USD
    - Add check constraint for valid currencies
    - Update existing records to use USD

  2. Notes
    - Safe migration that preserves existing data
    - Handles existing constraint gracefully
*/

-- Drop existing constraint if it exists
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_currency_check;

-- Add currency column with default value if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'currency'
  ) THEN
    ALTER TABLE products ADD COLUMN currency text NOT NULL DEFAULT 'USD';
  END IF;
END $$;

-- Add check constraint for valid currencies
ALTER TABLE products
  ADD CONSTRAINT products_currency_check
  CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'AUD'));

-- Update any existing products to use USD
UPDATE products 
SET currency = 'USD' 
WHERE currency IS NULL;