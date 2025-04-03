/*
  # Initial Schema Setup for CometGrowth Flow

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - role (text)
      - created_at (timestamp)
    - quote_forms
      - id (uuid, primary key)
      - title (text)
      - description (text)
      - created_by (uuid, references users)
      - created_at (timestamp)
    - form_fields
      - id (uuid, primary key)
      - form_id (uuid, references quote_forms)
      - label (text)
      - type (text)
      - options (jsonb)
      - price (numeric)
      - required (boolean)
      - order (integer)
    - customer_quotes
      - id (uuid, primary key)
      - form_id (uuid, references quote_forms)
      - customer_email (text)
      - company_name (text)
      - status (text)
      - total_price (numeric)
      - created_at (timestamp)
    - quote_responses
      - id (uuid, primary key)
      - quote_id (uuid, references customer_quotes)
      - field_id (uuid, references form_fields)
      - value (text)
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'user'))
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Quote Forms table
CREATE TABLE quote_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quote_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quote forms"
  ON quote_forms
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

CREATE POLICY "All users can view quote forms"
  ON quote_forms
  FOR SELECT
  TO authenticated
  USING (true);

-- Form Fields table
CREATE TABLE form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES quote_forms(id) ON DELETE CASCADE,
  label text NOT NULL,
  type text NOT NULL,
  options jsonb,
  price numeric DEFAULT 0,
  required boolean DEFAULT false,
  "order" integer NOT NULL,
  CONSTRAINT valid_type CHECK (type IN ('text', 'number', 'checkbox', 'select', 'textarea'))
);

ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage form fields"
  ON form_fields
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

CREATE POLICY "All users can view form fields"
  ON form_fields
  FOR SELECT
  TO authenticated
  USING (true);

-- Customer Quotes table
CREATE TABLE customer_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES quote_forms(id),
  customer_email text NOT NULL,
  company_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  total_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'accepted', 'rejected'))
);

ALTER TABLE customer_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotes they created"
  ON customer_quotes
  FOR SELECT
  TO authenticated
  USING (customer_email = (SELECT email FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all quotes"
  ON customer_quotes
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));

-- Quote Responses table
CREATE TABLE quote_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES customer_quotes(id) ON DELETE CASCADE,
  field_id uuid REFERENCES form_fields(id),
  value text NOT NULL
);

ALTER TABLE quote_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own responses"
  ON quote_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customer_quotes
      WHERE customer_quotes.id = quote_responses.quote_id
      AND customer_quotes.customer_email = (SELECT email FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all responses"
  ON quote_responses
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  ));