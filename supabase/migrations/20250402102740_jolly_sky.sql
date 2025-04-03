/*
  # Add NOK currency support

  1. Changes
    - Add NOK to the valid currencies list in products table
    - Preserves existing currency data

  2. Notes
    - Safe migration that only adds a new valid currency option
    - Does not affect existing products
*/

-- Drop existing currency constraint
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_currency_check;

-- Add updated constraint with NOK
ALTER TABLE products
  ADD CONSTRAINT products_currency_check
  CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NOK'));