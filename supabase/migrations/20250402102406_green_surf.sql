/*
  # Add currency support to products table

  1. Changes
    - Add currency column to products table
    - Set default currency to USD
    - Update existing products to use USD
    - Add check constraint for valid currencies

  2. Notes
    - Preserves existing price data
    - Ensures all products have a valid currency
*/

-- Add currency column with default value
ALTER TABLE products
  ADD COLUMN currency text NOT NULL DEFAULT 'USD';

-- Add check constraint for valid currencies
ALTER TABLE products
  ADD CONSTRAINT products_currency_check
  CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'AUD'));

-- Update any existing products to use USD
UPDATE products 
SET currency = 'USD' 
WHERE currency IS NULL;