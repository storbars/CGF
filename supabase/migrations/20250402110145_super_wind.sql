/*
  # Fix quote forms RLS policies

  1. Changes
    - Drop existing RLS policies for quote_forms table
    - Add updated policy for admins to manage quote forms
    - Add policy for authenticated users to view quote forms
    - Set created_by field automatically using auth.uid()

  2. Security
    - Only admins can create, update, and delete quote forms
    - All authenticated users can view quote forms
    - created_by is automatically set to the current user's ID
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage quote forms" ON quote_forms;
DROP POLICY IF EXISTS "All users can view quote forms" ON quote_forms;

-- Add trigger to set created_by
CREATE OR REPLACE FUNCTION set_quote_form_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_quote_form_created_by_trigger ON quote_forms;
CREATE TRIGGER set_quote_form_created_by_trigger
  BEFORE INSERT ON quote_forms
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_form_created_by();

-- Allow admins to manage quote forms
CREATE POLICY "Admins can manage quote forms"
ON quote_forms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow all authenticated users to view quote forms
CREATE POLICY "All users can view quote forms"
ON quote_forms
FOR SELECT
TO authenticated
USING (true);