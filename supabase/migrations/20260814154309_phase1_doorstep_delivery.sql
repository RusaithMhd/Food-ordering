-- Phase 1 Migration: University Doorstep Delivery Upgrades

-- 1. ENUM Updates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'ASSIGNED') THEN
        ALTER TYPE order_status ADD VALUE 'ASSIGNED' BEFORE 'OUT_FOR_DELIVERY';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'FAILED_DELIVERY') THEN
        ALTER TYPE order_status ADD VALUE 'FAILED_DELIVERY' AFTER 'DELIVERED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'REFUNDED') THEN
        ALTER TYPE order_status ADD VALUE 'REFUNDED' AFTER 'FAILED_DELIVERY';
    END IF;
END$$;

-- Address ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'address_type') THEN
        CREATE TYPE address_type AS ENUM ('UNIVERSITY', 'HOSTEL', 'PRIVATE_ADDRESS', 'CAMPUS', 'OTHER');
    END IF;
END$$;

-- Delivery Status ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
        CREATE TYPE delivery_status AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED');
    END IF;
END$$;

-- 2. Delivery Zones
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    minimum_order DECIMAL(10, 2) DEFAULT 0,
    estimated_delivery_minutes INTEGER DEFAULT 30,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Student Profiles
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    student_id VARCHAR(100),
    university_name VARCHAR(255),
    campus VARCHAR(255),
    preferred_phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Delivery Addresses
CREATE TABLE IF NOT EXISTS delivery_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
    label VARCHAR(100),
    recipient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    postcode VARCHAR(50),
    building_name VARCHAR(255),
    block VARCHAR(50),
    floor VARCHAR(50),
    room_number VARCHAR(50),
    delivery_instructions TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address_type address_type DEFAULT 'OTHER',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders Table Updates
ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS delivery_address_snapshot JSONB,
    ADD COLUMN IF NOT EXISTS delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL;

-- 6. Delivery Engine Tables
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    delivery_staff_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    status delivery_status DEFAULT 'PENDING',
    assigned_at TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    out_for_delivery_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cash_expected DECIMAL(10, 2) DEFAULT 0,
    cash_collected DECIMAL(10, 2) DEFAULT 0,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)
);

CREATE TABLE IF NOT EXISTS delivery_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    assigned_driver_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_batch_orders (
    batch_id UUID REFERENCES delivery_batches(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    PRIMARY KEY (batch_id, order_id)
);

-- 7. Order Status History & Events
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status order_status NOT NULL,
    changed_by VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Stock Reservations
CREATE TABLE IF NOT EXISTS stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id VARCHAR(255) REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Triggers
CREATE TRIGGER update_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_addresses_updated_at BEFORE UPDATE ON delivery_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_batches_updated_at BEFORE UPDATE ON delivery_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. RLS & Policies
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_batch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Will be hardened in Phase 2)
CREATE POLICY "Public read for delivery zones" ON delivery_zones FOR SELECT USING (true);
CREATE POLICY "Users can view own student profile" ON student_profiles FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own student profile" ON student_profiles FOR ALL USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can view own addresses" ON delivery_addresses FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can manage own addresses" ON delivery_addresses FOR ALL USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
