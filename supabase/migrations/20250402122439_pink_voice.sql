/*
  # Fix stack depth limit exceeded errors

  1. Changes
    - Replace recursive trigger with a simpler, non-recursive implementation
    - Optimize indexes for better performance
    - Add batch processing for field updates
*/

-- Drop existing triggers and function
DROP TRIGGER IF EXISTS maintain_form_field_order_on_insert ON form_fields;
DROP TRIGGER IF EXISTS maintain_form_field_order_on_update ON form_fields;
DROP FUNCTION IF EXISTS update_form_field_order();

-- Create new optimized function that avoids recursion
CREATE OR REPLACE FUNCTION update_form_field_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple update that only affects the current form's fields
  -- Uses a single UPDATE with window functions instead of recursion
  WITH ordered_fields AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY "order", id) - 1 as new_order
    FROM form_fields 
    WHERE form_id = NEW.form_id
  )
  UPDATE form_fields
  SET "order" = ordered_fields.new_order
  FROM ordered_fields
  WHERE form_fields.id = ordered_fields.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new triggers with better conditions
CREATE TRIGGER maintain_form_field_order_on_insert
  AFTER INSERT ON form_fields
  FOR EACH ROW
  WHEN (pg_trigger_depth() < 1)
  EXECUTE FUNCTION update_form_field_order();

CREATE TRIGGER maintain_form_field_order_on_update
  AFTER UPDATE OF "order", form_id ON form_fields
  FOR EACH ROW
  WHEN (
    pg_trigger_depth() < 1 AND
    (NEW.order IS DISTINCT FROM OLD.order OR NEW.form_id IS DISTINCT FROM OLD.form_id)
  )
  EXECUTE FUNCTION update_form_field_order();

-- Optimize indexes
DROP INDEX IF EXISTS idx_form_fields_lookup;
DROP INDEX IF EXISTS idx_form_fields_order_ops;

-- Create efficient indexes
CREATE INDEX idx_form_fields_order_lookup 
ON form_fields (form_id, "order")
INCLUDE (id);