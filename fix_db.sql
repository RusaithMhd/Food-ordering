-- Run this in your Supabase SQL Editor to fix the schema error!

-- Drop policies depending on columns
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

-- Drop foreign keys
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Alter column types
ALTER TABLE profiles ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE orders ALTER COLUMN customer_id TYPE VARCHAR(255);
ALTER TABLE user_roles ALTER COLUMN user_id TYPE VARCHAR(255);

-- Re-add foreign keys
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Re-add policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (customer_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (customer_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE customer_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
);
