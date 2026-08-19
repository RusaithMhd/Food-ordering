'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/getUser';
import { revalidatePath } from 'next/cache';

export async function cancelOrder(orderId: string) {
  try {
    const { user } = await getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createAdminClient();
    
    // Check if the order is within 30 minutes, still PLACED, and belongs to the user
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status, placed_at, customer_id')
      .eq('id', orderId)
      .single();
      
    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }
    
    if (order.customer_id !== user.uid) {
      return { success: false, error: 'Unauthorized to cancel this order' };
    }
    
    if (order.status !== 'PLACED') {
      return { success: false, error: 'Only pending orders can be cancelled' };
    }
    
    const placedAt = new Date(order.placed_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - placedAt.getTime()) / (1000 * 60);
    
    if (diffMinutes > 30) {
      return { success: false, error: 'Orders can only be cancelled within 30 minutes of placement' };
    }
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'CANCELLED' })
      .eq('id', orderId);
      
    if (updateError) {
      return { success: false, error: 'Failed to cancel order' };
    }
    
    revalidatePath('/orders');
    return { success: true };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
