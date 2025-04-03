/*
  # Fix user policies and roles

  1. Changes
    - Update RLS policies for users table to prevent recursion
    - Add policies for proper role-based access control
    - Make existing user an admin using their ID
*/

-- Update users table policies to fix recursion
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can delete user data" ON users;
DROP POLICY IF EXISTS "Admins can update user data" ON users;
DROP POLICY IF EXISTS "Users can insert own record during registration" ON users;

-- Create new policies without recursion
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete user data"
ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update user data"
ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can insert own record during registration"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND role = 'user'
);

-- Make the first user an admin
UPDATE users 
SET role = 'admin' 
WHERE id IN (
  SELECT id 
  FROM users 
  ORDER BY created_at 
  LIMIT 1
);