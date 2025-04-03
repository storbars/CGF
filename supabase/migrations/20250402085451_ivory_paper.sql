/*
  # Fix user registration RLS policies

  1. Changes
    - Drop existing policies on users table
    - Create new policies that properly handle registration
    - Fix first user admin creation
  
  2. Security
    - Enable RLS on users table
    - Add policies for:
      - Public registration with first user as admin
      - Reading own data
      - Admin management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can delete user data" ON users;
DROP POLICY IF EXISTS "Admins can update user data" ON users;
DROP POLICY IF EXISTS "Allow public registration" ON users;

-- Create new policies
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  role = 'admin'
);

CREATE POLICY "Admins can delete user data"
ON users
FOR DELETE
TO authenticated
USING (
  role = 'admin'
);

CREATE POLICY "Admins can update user data"
ON users
FOR UPDATE
TO authenticated
USING (
  role = 'admin'
)
WITH CHECK (
  role = 'admin'
);

-- Allow public registration with first user as admin
CREATE POLICY "Allow public registration"
ON users
FOR INSERT
TO public
WITH CHECK (
  -- Ensure the ID matches the authenticated user's ID if one exists
  (auth.uid() IS NULL OR auth.uid() = id) AND
  -- Ensure email is provided
  email IS NOT NULL AND
  (
    -- First user can be admin
    (NOT EXISTS (SELECT 1 FROM users) AND role = 'admin') OR
    -- Subsequent users must be regular users
    (EXISTS (SELECT 1 FROM users) AND role = 'user')
  )
);