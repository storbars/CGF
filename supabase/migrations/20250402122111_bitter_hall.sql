/*
  # Add clients table and update form handling

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `company_name` (text)
      - `phone` (text)
      - `address` (text)
      - `created_at` (timestamp)
      - `created_by` (uuid, references users)

  2. Changes
    - Add client_id to customer_quotes table
    - Update RLS policies
    - Add indexes for performance
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company_name text NOT NULL,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  UNIQUE(email, company_name)
);

-- Add client_id to customer_quotes
ALTER TABLE customer_quotes
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id);

-- Enable RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

-- RLS Policies for clients table
CREATE POLICY "Admins can manage all clients"
ON clients
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can view their own clients"
ON clients
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM customer_quotes
    WHERE customer_quotes.client_id = clients.id
    AND customer_quotes.customer_email = (
      SELECT email FROM users WHERE id = auth.uid()
    )
  )
);

-- Add duplicate function for quote forms
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
    slug
  )
  VALUES (
    old_form.title || ' (Copy)',
    old_form.description,
    old_form.show_prices,
    auth.uid(),
    false,
    NULL
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