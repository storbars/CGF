/*
  # Add published flag and slug to quote forms

  1. Changes
    - Add published flag to quote_forms table
    - Add unique slug constraint to quote_forms table
    - Add policy for public access to published forms

  2. Security
    - Enable RLS for public access to published forms
    - Add policy for anonymous users to view published forms
*/

-- Add published flag if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_forms' AND column_name = 'published'
  ) THEN
    ALTER TABLE quote_forms ADD COLUMN published boolean DEFAULT false;
  END IF;
END $$;

-- Add slug if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quote_forms' AND column_name = 'slug'
  ) THEN
    ALTER TABLE quote_forms ADD COLUMN slug text;
    ALTER TABLE quote_forms ADD CONSTRAINT quote_forms_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view published forms" ON quote_forms;

-- Create policy for public access to published forms
CREATE POLICY "Public can view published forms"
ON quote_forms
FOR SELECT
TO public
USING (published = true);