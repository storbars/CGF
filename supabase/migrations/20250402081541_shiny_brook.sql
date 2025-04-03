/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop existing RLS policies that cause recursion
    - Add new policies with proper checks that avoid recursion
    - Use auth.jwt() to check admin role instead of querying users table

  2. Security
    - Enable RLS on users table
    - Add policies for user management
    - Prevent infinite recursion in policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own record during registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can update user data" ON users;
DROP POLICY IF EXISTS "Admins can delete user data" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own record during registration
CREATE POLICY "Users can insert own record during registration"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND
  role = 'user'
);

-- Allow users to read their own data or admins to read all data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow admins to update user data
CREATE POLICY "Admins can update user data"
ON users
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

-- Allow admins to delete user data
CREATE POLICY "Admins can delete user data"
ON users
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);