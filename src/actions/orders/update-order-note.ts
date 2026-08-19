'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/getUser';
import { revalidatePath } from 'next/cache';

export async function updateOrderNote(orderId: string, note: string) {
  try {
    const { user } = await getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createAdminClient();
    
    // Check if the order is still PLACED and belongs to the user
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status, customer_id')
      .eq('id', orderId)
      .single();
      
    if (fetchError || !order) {
      return { success: false, error: 'Order not found' };
    }
    
    if (order.customer_id !== user.uid) {
      return { success: false, error: 'Unauthorized to update this order' };
    }

    if (order.status !== 'PLACED') {
      return { success: false, error: 'Notes can only be updated for pending orders' };
    }
    
    const { error: updateError } = await supabase
      .from('orders')
      .update({ customer_note: note })
      .eq('id', orderId);
      
    if (updateError) {
      return { success: false, error: 'Failed to update order note' };
    }
    
    revalidatePath('/orders');
    return { success: true };
  } catch (error) {
    console.error('Error updating order note:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
