/*
  # Optimize form fields and field order management

  1. Changes
    - Add optimized indexes for form fields lookups
    - Improve field order management trigger
    - Add constraints to prevent duplicates
    
  2. Performance
    - Batch updates for field ordering
    - Efficient indexing strategy
    
  3. Data Integrity
    - Prevent duplicate fields
    - Maintain consistent field order
*/

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_form_fields_lookup 
ON form_fields (form_id, "order");

-- Create efficient field order update function
CREATE OR REPLACE FUNCTION update_form_field_order()
RETURNS TRIGGER AS $$
DECLARE
  affected_fields INT;
BEGIN
  -- Get the number of fields that need updating
  SELECT COUNT(*)
  INTO affected_fields
  FROM form_fields
  WHERE form_id = NEW.form_id
    AND (
      NEW.order IS NULL OR 
      "order" BETWEEN LEAST(OLD.order, NEW.order) AND GREATEST(OLD.order, NEW.order)
    );

  -- Only proceed if we have a reasonable number of fields to update
  IF affected_fields < 1000 THEN
    -- Update only the affected rows
    UPDATE form_fields
    SET "order" = subquery.new_order
    FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (
          PARTITION BY form_id 
          ORDER BY "order", id
        ) - 1 as new_order
      FROM form_fields
      WHERE form_id = NEW.form_id
        AND (
          NEW.order IS NULL OR 
          "order" BETWEEN LEAST(OLD.order, NEW.order) AND GREATEST(OLD.order, NEW.order)
        )
    ) as subquery
    WHERE form_fields.id = subquery.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to use optimized function
DROP TRIGGER IF EXISTS maintain_form_field_order ON form_fields;
CREATE TRIGGER maintain_form_field_order
  AFTER INSERT OR UPDATE OF "order" ON form_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_form_field_order();

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'unique_field_per_form'
  ) THEN
    ALTER TABLE form_fields
    ADD CONSTRAINT unique_field_per_form 
    UNIQUE (form_id, label, type);
  END IF;
END $$;