/*
  # Add publishing support for quote forms

  1. Changes
    - Add published flag to quote_forms table
    - Add slug field for public URLs
    - Add unique constraint on slug

  2. Security
    - No changes to existing policies
*/

-- Add publishing columns to quote_forms
ALTER TABLE quote_forms
ADD COLUMN IF NOT EXISTS published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS slug text UNIQUE;