-- HOTFIX: Run this in your Supabase SQL Editor

-- 1. Rename 'active' to 'is_active' to match the codebase conventions
ALTER TABLE delivery_zones RENAME COLUMN active TO is_active;

-- 2. Add the missing zone_id to delivery_addresses
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL;

-- 3. Add is_active for soft deletes on addresses
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Rename customer_id and address lines to match the React components/actions
ALTER TABLE delivery_addresses RENAME COLUMN user_id TO customer_id;
ALTER TABLE delivery_addresses RENAME COLUMN address_line_1 TO address_line1;
ALTER TABLE delivery_addresses RENAME COLUMN address_line_2 TO address_line2;

-- 5. Drop the old policy and recreate it with customer_id
DROP POLICY IF EXISTS "Users can view own addresses" ON delivery_addresses;
DROP POLICY IF EXISTS "Users can manage own addresses" ON delivery_addresses;

CREATE POLICY "Users can view own addresses" ON delivery_addresses FOR SELECT USING (customer_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can manage own addresses" ON delivery_addresses FOR ALL USING (customer_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
