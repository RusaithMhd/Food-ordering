'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/getUser';

export async function getActiveOrdersStatus() {
  try {
    const { user } = await getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createAdminClient();
    
    // Fetch orders placed in the last 12 hours to check for status updates
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, total')
      .eq('customer_id', user.uid)
      .gte('placed_at', twelveHoursAgo);
      
    if (error) {
      return { success: false, error: 'Failed to fetch order status' };
    }
    
    return { success: true, orders: orders || [] };
  } catch (error) {
    console.error('Error fetching active orders status:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
