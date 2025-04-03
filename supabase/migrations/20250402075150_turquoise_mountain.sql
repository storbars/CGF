/*
  # Fix Users Table RLS Policies

  1. Changes
    - Drop existing RLS policies on users table
    - Add new policies for:
      - Allowing users to insert their own record during registration
      - Allowing users to read their own data
      - Allowing admins to read all user data

  2. Security
    - Enable RLS on users table
    - Add policies to ensure users can only access their own data
    - Add admin access policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;

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

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to update user data
CREATE POLICY "Admins can update user data"
ON users
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to delete user data
CREATE POLICY "Admins can delete user data"
ON users
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);