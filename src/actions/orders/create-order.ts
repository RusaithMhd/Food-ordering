'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/getUser';
import { logger } from '@/lib/logger';

interface CreateOrderData {
  delivery_address_id: string;
  customer_id: string;
  items: {
    menu_item_id: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
  customer_note?: string;
}

export async function createOrder(data: CreateOrderData) {
  const { user } = await getUser();

  if (!user || user.uid !== data.customer_id) {
    return { success: false, error: 'Unauthorized or invalid user context' };
  }

  try {
    const supabase = await createAdminClient();

    // Securely fetch actual prices from the database
    const menuItemIds = data.items.map(i => i.menu_item_id);
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, base_price')
      .in('id', menuItemIds)
      .eq('is_active', true);

    if (menuError || !menuItems || menuItems.length !== data.items.length) {
      logger.error('Failed to validate menu items or some items are inactive', { error: menuError });
      return { success: false, error: 'One or more items are unavailable or prices could not be verified' };
    }

    // Map fetched prices for secure calculation
    const priceMap = new Map(menuItems.map(item => [item.id, item.base_price]));

    let subtotal = 0;
    const secureOrderItems = data.items.map(item => {
      const actualUnitPrice = Number(priceMap.get(item.menu_item_id) || 0);
      const totalItemPrice = actualUnitPrice * Number(item.quantity);
      subtotal += totalItemPrice;

      return {
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: actualUnitPrice,
        total_price: totalItemPrice,
        notes: item.notes || ''
      };
    });

    // Securely fetch address and delivery zone fee
    const { data: address, error: addressError } = await supabase
      .from('delivery_addresses')
      .select('*, delivery_zones(delivery_fee, is_active)')
      .eq('id', data.delivery_address_id)
      .eq('customer_id', data.customer_id)
      .single();

    if (addressError || !address) {
      return { success: false, error: 'Invalid delivery address' };
    }

    if (!address.delivery_zones?.is_active) {
      return { success: false, error: 'Delivery zone is currently inactive' };
    }

    const tax = 0; // Tax calculation can be added here
    const delivery_fee = address.delivery_zones.delivery_fee || 0;
    const total = subtotal + tax + delivery_fee;

    // Create immutable snapshot of the address
    const delivery_address_snapshot = {
      address_type: address.address_type,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      landmark: address.landmark,
      zone_id: address.zone_id,
      delivery_fee: delivery_fee
    };

    // 1. Insert Order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: data.customer_id,
        delivery_address_id: data.delivery_address_id,
        delivery_address_snapshot,
        subtotal,
        tax,
        delivery_fee,
        total,
        customer_note: data.customer_note || '',
        status: 'PLACED'
      })
      .select()
      .single();

    if (orderError || !newOrder) {
      logger.error('Failed to create order', { error: orderError });
      return { success: false, error: 'Database error creating order' };
    }

    // 2. Insert Secure Order Items
    const orderItemsToInsert = secureOrderItems.map(item => ({
      order_id: newOrder.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      logger.error('Failed to create order items', { error: itemsError });
      // In a robust system, we would rollback the order creation here using a stored procedure or transaction.
      return { success: false, error: 'Failed to add items to order' };
    }

    return { success: true, orderId: newOrder.id };
  } catch (error) {
    logger.error('Error in createOrder', { error });
    return { success: false, error: 'Internal server error' };
  }
}
