/*
  # Optimize form field ordering

  1. Changes
    - Remove recursive trigger function
    - Add optimized indexes
    - Add efficient ordering mechanism
    - Add statement timeout as a session parameter
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS maintain_form_field_order ON form_fields;
DROP FUNCTION IF EXISTS update_form_field_order();

-- Create new optimized function that avoids recursion
CREATE OR REPLACE FUNCTION update_form_field_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple update that only affects the current form's fields
  -- Uses window functions instead of recursion
  UPDATE form_fields
  SET "order" = subq.new_order
  FROM (
    SELECT 
      id,
      row_number() OVER w - 1 as new_order
    FROM form_fields
    WHERE form_id = NEW.form_id
    WINDOW w AS (
      ORDER BY "order" ASC, id ASC
    )
  ) subq
  WHERE form_fields.id = subq.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create separate triggers for INSERT and UPDATE
CREATE TRIGGER maintain_form_field_order_on_insert
  AFTER INSERT ON form_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_form_field_order();

CREATE TRIGGER maintain_form_field_order_on_update
  AFTER UPDATE OF "order", form_id ON form_fields
  FOR EACH ROW
  WHEN (NEW.order IS DISTINCT FROM OLD.order OR NEW.form_id IS DISTINCT FROM OLD.form_id)
  EXECUTE FUNCTION update_form_field_order();

-- Optimize indexes
DROP INDEX IF EXISTS idx_form_fields_lookup;
DROP INDEX IF EXISTS idx_form_fields_order;

-- Create covering index for common lookups
CREATE INDEX idx_form_fields_lookup 
ON form_fields (form_id, "order")
INCLUDE (label, type, required, price);

-- Create index specifically for ordering operations
CREATE INDEX idx_form_fields_order_ops
ON form_fields (form_id, "order", id);

-- Set statement timeout for the current session
SET statement_timeout = '5s';