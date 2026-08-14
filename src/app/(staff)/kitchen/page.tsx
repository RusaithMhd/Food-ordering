import { createAdminClient } from '@/lib/supabase/server';
import { updateOrderStatus } from '@/actions/orders/update-status';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';

// Fetch orders with specific statuses
async function getKitchenOrders() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      rooms ( room_number ),
      order_items (
        id,
        quantity,
        notes,
        menu_items ( name )
      )
    `)
    .in('status', ['PLACED', 'CONFIRMED', 'PREPARING'])
    .order('placed_at', { ascending: true });

  if (error) {
    console.error('Error fetching kitchen orders:', error);
    return [];
  }
  return data || [];
}

export default async function KitchenDashboard() {
  const orders = await getKitchenOrders();

  const placedOrders = orders.filter(o => o.status === 'PLACED' || o.status === 'CONFIRMED');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Kitchen Dashboard</h1>
        <form action={async () => { 'use server'; revalidatePath('/kitchen'); }}>
          <Button variant="outline">Refresh</Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incoming/Confirmed Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
            Incoming &amp; Confirmed ({placedOrders.length})
          </h2>
          {placedOrders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Order #{order.id.split('-')[0]}</span>
                  <div className="font-bold text-lg">Room: {order.rooms?.room_number || 'N/A'}</div>
                </div>
                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {new Date(order.placed_at).toLocaleTimeString()}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center text-sm">
                    <span className="font-bold mr-2">{item.quantity}x</span>
                    <span>{item.menu_items?.name}</span>
                  </div>
                ))}
                {order.customer_note && (
                  <div className="text-sm bg-yellow-50 text-yellow-800 p-2 rounded mt-2">
                    <span className="font-semibold">Note:</span> {order.customer_note}
                  </div>
                )}
              </div>

              <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'PREPARING'); }}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Start Preparing</Button>
              </form>
            </div>
          ))}
        </div>

        {/* Preparing Column */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold bg-orange-100 text-orange-800 px-4 py-2 rounded-lg">
            Currently Preparing ({preparingOrders.length})
          </h2>
          {preparingOrders.map((order) => (
            <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Order #{order.id.split('-')[0]}</span>
                  <div className="font-bold text-lg">Room: {order.rooms?.room_number || 'N/A'}</div>
                </div>
              </div>

              <div className="space-y-2 mb-6 opacity-75">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center text-sm">
                    <span className="font-bold mr-2">{item.quantity}x</span>
                    <span>{item.menu_items?.name}</span>
                  </div>
                ))}
              </div>

              <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'READY'); }}>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Mark as Ready</Button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
