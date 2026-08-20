import { createAdminClient } from '@/lib/supabase/server';
import { DispatchClient } from './DispatchClient';

export const metadata = {
  title: 'Delivery Dispatch - Admin',
};

async function getReadyOrders() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      placed_at,
      status,
      delivery_address_snapshot
    `)
    .eq('status', 'READY')
    .order('placed_at', { ascending: true });

  if (error) {
    console.error('Error fetching ready orders:', error);
    return [];
  }
  return data || [];
}

async function getDrivers() {
  const supabase = await createAdminClient();
  // Fetch users who have the DRIVER role
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, roles!inner(name), profiles(id, full_name, phone_number)')
    .eq('roles.name', 'DRIVER');

  if (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
  
  // Extract profiles
  return (data || [])
    .map(row => row.profiles)
    .filter(Boolean); // removes nulls if any
}

export default async function AdminDeliveryPage() {
  const [readyOrders, drivers] = await Promise.all([
    getReadyOrders(),
    getDrivers()
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Delivery Dispatch</h1>
          <p className="text-slate-500 mt-1 font-medium">Assign ready orders to delivery drivers.</p>
        </div>
      </div>

      <DispatchClient readyOrders={readyOrders} drivers={drivers} />
    </div>
  );
}
