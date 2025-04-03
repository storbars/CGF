/*
  # Fix user policies recursion

  1. Changes
    - Simplify RLS policies to avoid recursion
    - Use JWT claims instead of querying users table
    - Update admin check to use role claim from JWT
*/

-- Update users table policies to fix recursion
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can delete user data" ON users;
DROP POLICY IF EXISTS "Admins can update user data" ON users;
DROP POLICY IF EXISTS "Users can insert own record during registration" ON users;

-- Create new policies using JWT claims
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Admins can delete user data"
ON users
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Admins can update user data"
ON users
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
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