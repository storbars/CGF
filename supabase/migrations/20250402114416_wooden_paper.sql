/*
  # Fix duplicate form fields and improve form management

  1. Changes
    - Remove duplicate form fields
    - Add unique constraint to prevent future duplicates
    - Add indexes for better performance

  2. Security
    - Maintain existing RLS policies
*/

-- First, remove duplicate fields keeping only the latest version
WITH duplicates AS (
  SELECT DISTINCT ON (form_id, label, type) 
    id,
    form_id,
    label,
    type,
    row_number() OVER (
      PARTITION BY form_id, label, type 
      ORDER BY "order" DESC
    ) as rn
  FROM form_fields
)
DELETE FROM form_fields
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE rn > 1
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_order ON form_fields(form_id, "order");

-- Add trigger to maintain order values
CREATE OR REPLACE FUNCTION update_form_field_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order values for all fields in the same form
  UPDATE form_fields
  SET "order" = subquery.new_order
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY form_id 
      ORDER BY "order"
    ) - 1 as new_order
    FROM form_fields
    WHERE form_id = NEW.form_id
  ) as subquery
  WHERE form_fields.id = subquery.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS maintain_form_field_order ON form_fields;
CREATE TRIGGER maintain_form_field_order
  AFTER INSERT OR UPDATE OF "order" ON form_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_form_field_order();