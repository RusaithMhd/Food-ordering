-- Demo Data Seed Script for Hotel Ordering App
-- This will populate your database with sample categories, menu items, delivery zones, and rooms.
-- Run this in your Supabase SQL Editor.

DO $$ 
DECLARE
    default_hotel_id UUID;
    default_branch_id UUID;
    cat_burgers_id UUID;
    cat_pizza_id UUID;
    cat_drinks_id UUID;
BEGIN
    -- 1. Ensure we have the default hotel and branch
    SELECT id INTO default_hotel_id FROM hotels LIMIT 1;
    
    IF default_hotel_id IS NULL THEN
        INSERT INTO hotels (name) VALUES ('Main Restaurant') RETURNING id INTO default_hotel_id;
    END IF;

    SELECT id INTO default_branch_id FROM branches LIMIT 1;
    
    IF default_branch_id IS NULL THEN
        INSERT INTO branches (hotel_id, name, timezone, status) 
        VALUES (default_hotel_id, 'Main Kitchen', 'UTC', 'OPEN')
        RETURNING id INTO default_branch_id;
    END IF;

    -- ==========================================
    -- 2. Delivery Zones
    -- ==========================================
    INSERT INTO delivery_zones (name, description, delivery_fee, minimum_order, is_active)
    VALUES 
        ('North Campus', 'All dorms and academic buildings in the North Campus area.', 2.50, 10.00, true),
        ('South Campus', 'South campus dormitories and stadium area.', 3.00, 15.00, true),
        ('City Center', 'Downtown and city center delivery locations.', 5.00, 25.00, true)
    ON CONFLICT DO NOTHING;

    -- ==========================================
    -- 3. Categories
    -- ==========================================
    INSERT INTO categories (branch_id, name, description, sort_order, is_active)
    VALUES 
        (default_branch_id, 'Gourmet Burgers', 'Juicy, handcrafted burgers made with 100% Angus beef.', 1, true)
    RETURNING id INTO cat_burgers_id;

    INSERT INTO categories (branch_id, name, description, sort_order, is_active)
    VALUES 
        (default_branch_id, 'Artisan Pizza', 'Wood-fired pizzas with authentic Italian ingredients.', 2, true)
    RETURNING id INTO cat_pizza_id;

    INSERT INTO categories (branch_id, name, description, sort_order, is_active)
    VALUES 
        (default_branch_id, 'Beverages', 'Refreshing cold drinks and sodas.', 3, true)
    RETURNING id INTO cat_drinks_id;

    -- ==========================================
    -- 4. Menu Items
    -- ==========================================
    -- Burgers
    INSERT INTO menu_items (category_id, branch_id, name, description, base_price, preparation_time_minutes, is_vegetarian, image_url)
    VALUES 
        (cat_burgers_id, default_branch_id, 'Classic Cheeseburger', 'Angus beef patty, cheddar cheese, lettuce, tomato, and our secret sauce.', 12.99, 15, false, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop'),
        (cat_burgers_id, default_branch_id, 'BBQ Bacon Smash', 'Double smash patties, crispy bacon, onion rings, and smoky BBQ sauce.', 15.99, 20, false, 'https://images.unsplash.com/photo-1594212202875-5452d3aee6f5?q=80&w=800&auto=format&fit=crop'),
        (cat_burgers_id, default_branch_id, 'Beyond Veggie Burger', 'Plant-based patty, vegan cheese, avocado, and sprouts on a brioche bun.', 14.50, 15, true, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?q=80&w=800&auto=format&fit=crop');

    -- Pizzas
    INSERT INTO menu_items (category_id, branch_id, name, description, base_price, preparation_time_minutes, is_vegetarian, image_url)
    VALUES 
        (cat_pizza_id, default_branch_id, 'Margherita Classico', 'San Marzano tomato sauce, fresh mozzarella, and basil leaves.', 16.00, 25, true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop'),
        (cat_pizza_id, default_branch_id, 'Spicy Pepperoni', 'Loaded with premium pepperoni, mozzarella, and a dash of hot honey.', 18.50, 25, false, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop');

    -- Drinks
    INSERT INTO menu_items (category_id, branch_id, name, description, base_price, preparation_time_minutes, is_vegetarian, image_url)
    VALUES 
        (cat_drinks_id, default_branch_id, 'Ice Cold Cola', 'Classic cola served with ice.', 2.99, 2, true, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop'),
        (cat_drinks_id, default_branch_id, 'Fresh Lemonade', 'House-made lemonade with freshly squeezed lemons and a hint of mint.', 3.99, 5, true, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop');

    -- Rooms removed as this is a restaurant-only app.

END $$;
