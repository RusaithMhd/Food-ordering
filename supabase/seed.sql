-- Insert Default Roles
INSERT INTO roles (id, name, description) VALUES
  (gen_random_uuid(), 'CUSTOMER', 'Standard customer role'),
  (gen_random_uuid(), 'KITCHEN', 'Kitchen staff for managing KOTs'),
  (gen_random_uuid(), 'DELIVERY', 'Delivery driver role'),
  (gen_random_uuid(), 'MANAGER', 'Branch manager role'),
  (gen_random_uuid(), 'ADMIN', 'Hotel admin role'),
  (gen_random_uuid(), 'SUPER_ADMIN', 'Global platform admin role')
ON CONFLICT (name) DO NOTHING;

-- Insert Default Permissions
INSERT INTO permissions (id, name, description) VALUES
  (gen_random_uuid(), 'dashboard.view', 'View admin dashboard'),
  (gen_random_uuid(), 'orders.view', 'View all orders'),
  (gen_random_uuid(), 'orders.manage', 'Manage order statuses'),
  (gen_random_uuid(), 'menu.view', 'View menu items'),
  (gen_random_uuid(), 'menu.manage', 'Manage menu items'),
  (gen_random_uuid(), 'kitchen.view', 'View KOTs'),
  (gen_random_uuid(), 'kitchen.manage', 'Manage KOT statuses'),
  (gen_random_uuid(), 'delivery.view', 'View deliveries'),
  (gen_random_uuid(), 'delivery.manage', 'Manage delivery batches')
ON CONFLICT (name) DO NOTHING;

-- Map permissions to roles (Using DO DO NOTHING to ignore conflicts)
-- Note: In a real environment, you'd query the IDs. For the seed, it's easier to use a DO block or subqueries.
DO $$
DECLARE
  v_kitchen_id UUID;
  v_admin_id UUID;
  v_manager_id UUID;
  
  v_kitchen_view_id UUID;
  v_kitchen_manage_id UUID;
  v_orders_view_id UUID;
  v_dashboard_view_id UUID;
BEGIN
  -- Get Role IDs
  SELECT id INTO v_kitchen_id FROM roles WHERE name = 'KITCHEN';
  SELECT id INTO v_admin_id FROM roles WHERE name = 'ADMIN';
  SELECT id INTO v_manager_id FROM roles WHERE name = 'MANAGER';
  
  -- Get Permission IDs
  SELECT id INTO v_kitchen_view_id FROM permissions WHERE name = 'kitchen.view';
  SELECT id INTO v_kitchen_manage_id FROM permissions WHERE name = 'kitchen.manage';
  SELECT id INTO v_orders_view_id FROM permissions WHERE name = 'orders.view';
  SELECT id INTO v_dashboard_view_id FROM permissions WHERE name = 'dashboard.view';

  -- Kitchen Role
  INSERT INTO role_permissions (role_id, permission_id) VALUES (v_kitchen_id, v_kitchen_view_id) ON CONFLICT DO NOTHING;
  INSERT INTO role_permissions (role_id, permission_id) VALUES (v_kitchen_id, v_kitchen_manage_id) ON CONFLICT DO NOTHING;

  -- Admin Role (gets everything)
  INSERT INTO role_permissions (role_id, permission_id) 
  SELECT v_admin_id, id FROM permissions ON CONFLICT DO NOTHING;

  -- Manager Role
  INSERT INTO role_permissions (role_id, permission_id) 
  SELECT v_manager_id, id FROM permissions WHERE name IN ('dashboard.view', 'orders.view', 'kitchen.view', 'delivery.view') ON CONFLICT DO NOTHING;
  
END $$;
