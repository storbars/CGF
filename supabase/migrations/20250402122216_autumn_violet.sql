/*
  # Fix form field requirements and add client handling

  1. Changes
    - Add constraint to only allow required flag on input fields
    - Add client selection to quote forms
    - Add duplicate form function
*/

-- Add check constraint to ensure only input fields can be required
ALTER TABLE form_fields
DROP CONSTRAINT IF EXISTS valid_required_fields;

ALTER TABLE form_fields
ADD CONSTRAINT valid_required_fields
CHECK (
  (type IN ('header', 'content', 'image', 'product') AND required = false) OR
  (type IN ('text', 'number', 'checkbox', 'select', 'textarea'))
);

-- Add client selection to quote forms
ALTER TABLE quote_forms
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

-- Create function to duplicate a form
CREATE OR REPLACE FUNCTION duplicate_quote_form(form_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_form_id uuid;
  old_form RECORD;
BEGIN
  -- Get the original form
  SELECT * INTO old_form
  FROM quote_forms
  WHERE id = form_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Form not found';
  END IF;

  -- Create new form
  INSERT INTO quote_forms (
    title,
    description,
    show_prices,
    created_by,
    published,
    slug,
    client_id
  )
  VALUES (
    old_form.title || ' (Copy)',
    old_form.description,
    old_form.show_prices,
    auth.uid(),
    false,
    NULL,
    old_form.client_id
  )
  RETURNING id INTO new_form_id;

  -- Copy fields
  INSERT INTO form_fields (
    form_id,
    label,
    type,
    options,
    required,
    price,
    "order",
    product_id,
    quantity_field,
    content,
    image_url
  )
  SELECT
    new_form_id,
    label,
    type,
    options,
    required,
    price,
    "order",
    product_id,
    quantity_field,
    content,
    image_url
  FROM form_fields
  WHERE form_id = form_id
  ORDER BY "order";

  RETURN new_form_id;
END;
$$;