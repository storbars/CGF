/*
  # Add Form Management Features

  1. Changes
    - Add cascade delete to form_fields when quote_form is deleted
    - Add policies for form management
    - Add indexes for better performance

  2. Security
    - Enable RLS on quote_forms table
    - Add policies for admin-only form management
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage quote forms" ON quote_forms;
DROP POLICY IF EXISTS "All users can view quote forms" ON quote_forms;

-- Enable RLS on quote_forms
ALTER TABLE quote_forms ENABLE ROW LEVEL SECURITY;

-- Add cascade delete to form_fields
ALTER TABLE form_fields
DROP CONSTRAINT IF EXISTS form_fields_form_id_fkey,
ADD CONSTRAINT form_fields_form_id_fkey
  FOREIGN KEY (form_id)
  REFERENCES quote_forms(id)
  ON DELETE CASCADE;

-- Add policies for quote_forms
CREATE POLICY "Admins can manage quote forms"
ON quote_forms
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "All users can view quote forms"
ON quote_forms
FOR SELECT
TO authenticated
USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quote_forms_created_at ON quote_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_order ON form_fields(form_id, "order");