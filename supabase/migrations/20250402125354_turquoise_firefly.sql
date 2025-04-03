/*
  # Add new fields to clients table

  1. Changes
    - Split address into street_address_1 and street_address_2
    - Add country, zipcode, place fields
    - Add website field
    - Add internal_notes field

  2. Data Migration
    - Move existing address data to street_address_1
*/

-- Add new columns
ALTER TABLE clients
ADD COLUMN street_address_1 text,
ADD COLUMN street_address_2 text,
ADD COLUMN country text,
ADD COLUMN zipcode text,
ADD COLUMN place text,
ADD COLUMN website text,
ADD COLUMN internal_notes text;

-- Migrate existing address data
UPDATE clients
SET street_address_1 = address
WHERE address IS NOT NULL;

-- Drop old address column
ALTER TABLE clients
DROP COLUMN address;