import { createAdminClient } from '@/lib/supabase/server';
import { updateOrderStatus } from '@/actions/orders/update-status';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { MapPin, Navigation, PackageCheck, Truck, RefreshCw, Phone, User, DollarSign } from 'lucide-react';

async function getDeliveryOrders() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      rooms ( room_number ),
      profiles ( full_name, phone_number )
    `)
    .in('status', ['READY', 'OUT_FOR_DELIVERY'])
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching delivery orders:', error);
    return [];
  }
  return data || [];
}

export default async function DeliveryDashboard() {
  const orders = await getDeliveryOrders();

  const readyOrders = orders.filter(o => o.status === 'READY');
  const outForDeliveryOrders = orders.filter(o => o.status === 'OUT_FOR_DELIVERY');

  return (
    <div className="min-h-screen bg-slate-50 pt-6 pb-24 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Truck className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Delivery Hub</h1>
            </div>
            <p className="text-slate-500 font-medium">Manage pickups and active deliveries.</p>
          </div>
          <form action={async () => { 'use server'; revalidatePath('/delivery'); }}>
            <Button variant="outline" className="rounded-full bg-white border-slate-200 shadow-sm font-medium hover:bg-slate-50">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ready for Pickup Column */}
          <div className="flex flex-col h-[calc(100vh-180px)]">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 px-5 py-3 rounded-t-2xl">
              <h2 className="text-lg font-bold text-emerald-900 flex items-center">
                <PackageCheck className="w-5 h-5 mr-2 text-emerald-500" />
                Ready for Pickup
              </h2>
              <span className="bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                {readyOrders.length}
              </span>
            </div>
            <div className="flex-1 bg-slate-100/50 border-x border-b border-slate-200/60 rounded-b-2xl p-4 overflow-y-auto hide-scrollbar space-y-4 shadow-inner">
              {readyOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <PackageCheck className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="font-medium text-sm">No orders waiting for pickup</p>
                </div>
              ) : readyOrders.map((order) => {
                const isDelivery = order.customer_note?.includes('DELIVERY ADDRESS:');
                const locationLabel = isDelivery 
                  ? order.customer_note.replace('DELIVERY ADDRESS:', '').trim()
                  : order.rooms?.room_number ? `Room ${order.rooms.room_number}` : 'Unknown Location';

                return (
                  <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 text-lg">Order #{order.id.split('-')[0].toUpperCase()}</span>
                        </div>
                        <div className="flex items-start space-x-1.5 mt-2 text-emerald-700 font-bold text-lg bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100/50 inline-flex">
                          <MapPin className="w-5 h-5 mt-0.5 shrink-0" />
                          <span className="leading-tight">{locationLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 ml-2 space-y-3">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <User className="w-4 h-4 mr-2 text-slate-400" />
                        {order.profiles?.full_name || 'Guest'}
                      </div>
                      <div className="flex items-center text-sm font-black text-slate-900 bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                        <DollarSign className="w-4 h-4 mr-1 text-emerald-500" />
                        {order.total.toFixed(2)} <span className="text-slate-400 font-semibold ml-2 text-xs uppercase tracking-wider">(Cash on Delivery)</span>
                      </div>
                    </div>

                    <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'OUT_FOR_DELIVERY'); }} className="ml-2">
                      <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all text-base flex items-center justify-center">
                        <Navigation className="w-5 h-5 mr-2" /> Start Delivery
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Out for Delivery Column */}
          <div className="flex flex-col h-[calc(100vh-180px)]">
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 px-5 py-3 rounded-t-2xl">
              <h2 className="text-lg font-bold text-indigo-900 flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-indigo-500" />
                Active Deliveries
              </h2>
              <span className="bg-indigo-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                {outForDeliveryOrders.length}
              </span>
            </div>
            <div className="flex-1 bg-slate-100/50 border-x border-b border-slate-200/60 rounded-b-2xl p-4 overflow-y-auto hide-scrollbar space-y-4 shadow-inner">
              {outForDeliveryOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Navigation className="w-12 h-12 mb-3 text-slate-300 opacity-50" />
                  <p className="font-medium text-sm">No active deliveries</p>
                </div>
              ) : outForDeliveryOrders.map((order) => {
                const isDelivery = order.customer_note?.includes('DELIVERY ADDRESS:');
                const locationLabel = isDelivery 
                  ? order.customer_note.replace('DELIVERY ADDRESS:', '').trim()
                  : order.rooms?.room_number ? `Room ${order.rooms.room_number}` : 'Unknown Location';

                return (
                  <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900 text-lg">Order #{order.id.split('-')[0].toUpperCase()}</span>
                          <span className="flex h-2.5 w-2.5 relative ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                          </span>
                        </div>
                        <div className="flex items-start space-x-1.5 mt-2 text-indigo-700 font-bold text-lg bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100/50 inline-flex">
                          <MapPin className="w-5 h-5 mt-0.5 shrink-0" />
                          <span className="leading-tight">{locationLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100 ml-2 space-y-3">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <User className="w-4 h-4 mr-2 text-slate-400" />
                        {order.profiles?.full_name || 'Guest'}
                      </div>
                      <div className="flex items-center justify-between text-sm font-black text-slate-900 bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm">
                        <div className="flex items-center text-amber-900">
                          <DollarSign className="w-5 h-5 mr-1 text-amber-500" />
                          <span className="text-lg">{order.total.toFixed(2)}</span>
                        </div>
                        <span className="text-amber-700/80 font-bold text-xs uppercase tracking-wider bg-amber-200/50 px-2 py-1 rounded">Collect Cash</span>
                      </div>
                    </div>

                    <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'DELIVERED'); }} className="ml-2">
                      <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all text-base flex items-center justify-center">
                        <PackageCheck className="w-5 h-5 mr-2" /> Mark Delivered &amp; Paid
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
