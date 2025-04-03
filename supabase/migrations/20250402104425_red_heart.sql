/*
  # Add RLS policies for products table

  1. Security Changes
    - Enable RLS on products table
    - Add policy for admins to manage products
    - Add policy for all authenticated users to view products

  2. Changes
    - Ensures proper access control for products table
    - Admins can perform all operations (CRUD)
    - All authenticated users can view products
*/

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "All users can view products" ON products;

-- Create policies
CREATE POLICY "Admins can manage products"
ON products
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

CREATE POLICY "All users can view products"
ON products
FOR SELECT
TO authenticated
USING (true);