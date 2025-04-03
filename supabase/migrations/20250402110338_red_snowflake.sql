/*
  # Fix quote forms RLS policies

  1. Changes
    - Drop and recreate RLS policies for quote_forms table
    - Add trigger to set created_by automatically
    - Ensure policies don't conflict with existing ones

  2. Security
    - Only admins can create, update, and delete quote forms
    - All authenticated users can view quote forms
    - created_by is automatically set to the current user's ID
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage quote forms" ON quote_forms;
DROP POLICY IF EXISTS "All users can view quote forms" ON quote_forms;

-- Enable RLS
ALTER TABLE quote_forms ENABLE ROW LEVEL SECURITY;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION set_quote_form_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS set_quote_form_created_by_trigger ON quote_forms;
CREATE TRIGGER set_quote_form_created_by_trigger
  BEFORE INSERT ON quote_forms
  FOR EACH ROW
  EXECUTE FUNCTION set_quote_form_created_by();

-- Create new policies
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

CREATE POLICY "All users can view quote forms"
ON quote_forms
FOR SELECT
TO authenticated
USING (true);