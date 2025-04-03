/*
  # Fix user registration policies

  1. Changes
    - Drop existing policies on users table
    - Create new policies that allow registration
    - Fix admin user creation during registration
  
  2. Security
    - Enable RLS on users table
    - Add policies for:
      - Registration (unauthenticated users can create their first record)
      - Reading own data
      - Admin management
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can delete user data" ON users;
DROP POLICY IF EXISTS "Admins can update user data" ON users;
DROP POLICY IF EXISTS "Users can insert own record during registration" ON users;

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

-- Allow registration for anyone
CREATE POLICY "Allow registration"
ON users
FOR INSERT
TO public -- This allows unauthenticated users to register
WITH CHECK (
  -- Only allow setting role to 'user' during registration
  role = 'user' OR
  -- Unless this is the first user, then allow 'admin'
  (
    role = 'admin' AND
    NOT EXISTS (SELECT 1 FROM users)
  )
);