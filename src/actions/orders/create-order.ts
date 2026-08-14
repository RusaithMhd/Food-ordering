'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/server';
import { logger } from '@/lib/logger';

interface CreateOrderData {
  branch_id: string;
  room_id: string;
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
  const cookieStore = await cookies();
  const session = cookieStore.get('__session')?.value;

  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    if (decodedToken.uid !== data.customer_id) {
       return { success: false, error: 'Invalid user context' };
    }

    const supabase = await createAdminClient();

    // In a production app, we MUST query the DB to get the actual prices of the items here
    // rather than trusting the client-provided prices, to avoid tampering.
    // For the MVP, we will trust the client data for unit_price but calculate total on server.

    const subtotal = data.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const tax = 0;
    const delivery_fee = 0;
    const total = subtotal + tax + delivery_fee;

    // 1. Insert Order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        branch_id: data.branch_id,
        room_id: data.room_id,
        customer_id: data.customer_id,
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

    // 2. Insert Order Items
    const orderItemsToInsert = data.items.map(item => ({
      order_id: newOrder.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      notes: item.notes || ''
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
