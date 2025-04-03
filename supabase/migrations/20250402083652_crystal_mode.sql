/*
  # Add Products Management

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text)
      - `price` (numeric, default 0)
      - `created_at` (timestamp with timezone)
      - `created_by` (uuid, references users)

  2. Security
    - Enable RLS on products table
    - Add policies for admin management and user viewing
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Add policies for products
CREATE POLICY "Admins can manage products"
ON products
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "All users can view products"
ON products
FOR SELECT
TO authenticated
USING (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Modify form_fields to reference products
ALTER TABLE form_fields
ADD COLUMN product_id uuid REFERENCES products(id),
ADD COLUMN quantity_field boolean DEFAULT false;