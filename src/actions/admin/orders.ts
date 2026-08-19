'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/permissions/withAuth';
import { revalidatePath } from 'next/cache';

export const getAdminOrders = withAuth(
  async (statusFilter?: string) => {
    const supabase = await createAdminClient();
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles:customer_id (
          full_name,
          email,
          phone_number
        ),
        delivery_zones:delivery_zone_id (
          name
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price,
          menu_items (
            name
          )
        )
      `)
      .order('placed_at', { ascending: false });

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin orders:', error);
      throw new Error('Failed to fetch orders');
    }

    return data;
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

export const updateAdminOrderStatus = withAuth(
  async (orderId: string, status: string) => {
    const supabase = await createAdminClient();
    
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: 'Failed to update order status' };
    }

    revalidatePath('/admin/orders');
    revalidatePath('/kitchen');
    revalidatePath('/delivery');
    return { success: true };
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

export const createAdminOrder = withAuth(
  async (data: {
    customer_id?: string | null;
    recipient_name: string;
    phone: string;
    location: string;
    customer_note?: string;
    items: { menu_item_id: string; quantity: number }[];
  }) => {
    try {
      const supabase = await createAdminClient();

      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'Order must contain at least one item' };
      }

      // Fetch menu items to validate prices and calculate totals
      const menuItemIds = data.items.map(i => i.menu_item_id);
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, base_price, name')
        .in('id', menuItemIds);

      if (menuError || !menuItems || menuItems.length !== data.items.length) {
        return { success: false, error: 'One or more menu items could not be found' };
      }

      const priceMap = new Map(menuItems.map(item => [item.id, item.base_price]));
      let subtotal = 0;
      
      const secureOrderItems = data.items.map(item => {
        const unitPrice = Number(priceMap.get(item.menu_item_id) || 0);
        const totalPrice = unitPrice * Number(item.quantity);
        subtotal += totalPrice;
        return {
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          notes: ''
        };
      });

      const delivery_fee = 2.50; // Default fee
      const total = subtotal + delivery_fee;

      // Get default branch
      const { data: defaultBranch } = await supabase.from('branches').select('id').limit(1).single();

      const delivery_address_snapshot = {
        address_type: 'CUSTOM',
        address_line1: data.location,
        recipient_name: data.recipient_name,
        phone: data.phone,
        delivery_fee: delivery_fee
      };

      // 1. Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          branch_id: defaultBranch?.id,
          customer_id: data.customer_id || null,
          delivery_address_snapshot,
          subtotal,
          tax: 0,
          delivery_fee,
          total,
          customer_note: data.customer_note || '',
          status: 'PLACED'
        })
        .select()
        .single();

      if (orderError || !newOrder) {
        console.error('Failed to insert order:', orderError);
        return { success: false, error: 'Database error creating order' };
      }

      // 2. Insert items
      const orderItemsToInsert = secureOrderItems.map(item => ({
        order_id: newOrder.id,
        ...item
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) {
        console.error('Failed to insert order items:', itemsError);
        return { success: false, error: 'Failed to add items to order' };
      }

      revalidatePath('/admin/orders');
      revalidatePath('/kitchen');
      revalidatePath('/delivery');
      return { success: true, orderId: newOrder.id };
    } catch (error) {
      console.error('Error creating admin order:', error);
      return { success: false, error: 'Internal server error' };
    }
  },
  { requiredRoles: ['ADMIN', 'MANAGER', 'SUPER_ADMIN'] }
);

