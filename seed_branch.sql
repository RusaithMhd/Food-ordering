-- Run this script in your Supabase SQL Editor to seed the default Hotel and Branch
-- This is required for Categories and Menu Items to function properly in the single-kitchen architecture

DO $$ 
DECLARE
    default_hotel_id UUID;
    default_branch_id UUID;
BEGIN
    -- Check if a hotel already exists
    SELECT id INTO default_hotel_id FROM hotels LIMIT 1;
    
    IF default_hotel_id IS NULL THEN
        -- Insert a default hotel
        INSERT INTO hotels (name) 
        VALUES ('University Campus Delivery')
        RETURNING id INTO default_hotel_id;
    END IF;

    -- Check if a branch already exists
    SELECT id INTO default_branch_id FROM branches LIMIT 1;
    
    IF default_branch_id IS NULL THEN
        -- Insert a default branch linked to the hotel
        INSERT INTO branches (hotel_id, name, timezone, status) 
        VALUES (default_hotel_id, 'Main Kitchen', 'UTC', 'OPEN')
        RETURNING id INTO default_branch_id;
    END IF;

END $$;
