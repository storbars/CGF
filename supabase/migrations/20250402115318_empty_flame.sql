-- Remove duplicate fields while keeping the latest version
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

-- Add unique constraint to prevent future duplicates
ALTER TABLE form_fields
ADD CONSTRAINT unique_field_per_form UNIQUE (form_id, label, type);