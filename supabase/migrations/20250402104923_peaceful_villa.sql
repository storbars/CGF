/*
  # Add price visibility control to quote forms

  1. Changes
    - Add show_prices column to quote_forms table
    - Default to false (prices hidden)

  2. Notes
    - This allows admins to control whether prices are visible to users
    - When false, prices are hidden until the quote is submitted
*/

-- Add show_prices column to quote_forms
ALTER TABLE quote_forms
  ADD COLUMN IF NOT EXISTS show_prices boolean NOT NULL DEFAULT false;