import { createAdminClient } from '@/lib/supabase/server';
import { updateBatchStatus } from '@/actions/delivery/batches';
import { updateOrderStatus } from '@/actions/orders/update-status';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { Bike, Package, MapPin, CheckCircle2, Clock, Phone, AlertCircle } from 'lucide-react';
import { getUser } from '@/lib/auth/getUser';

async function getDeliveryBatches(driverId: string) {
  const supabase = await createAdminClient();
  
  // Fetch active batches for this driver
  const { data: batches, error } = await supabase
    .from('delivery_batches')
    .select(`
      *,
      delivery_batch_orders (
        order_id,
        orders (
          id,
          status,
          total,
          customer_note,
          delivery_address_snapshot
        )
      )
    `)
    .eq('assigned_driver_id', driverId)
    .in('status', ['PENDING', 'IN_PROGRESS'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching delivery batches:', error);
    return [];
  }
  return batches || [];
}

export default async function DeliveryDashboard() {
  const { user } = await getUser();
  if (!user) return null; // Handled by layout

  const batches = await getDeliveryBatches(user.uid);

  return (
    <div className="min-h-screen bg-slate-50 pt-6 pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
              <Bike className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Delivery Run</h1>
              <p className="text-slate-500 font-medium text-sm">Active deliveries assigned to you</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {batches.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Package className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Deliveries</h3>
              <p className="text-slate-500 text-sm">You have no pending deliveries assigned at the moment.</p>
              <form action={async () => { 'use server'; revalidatePath('/delivery'); }}>
                <Button className="mt-6 rounded-xl bg-slate-900 text-white font-medium px-6 hover:bg-slate-800">
                  <Clock className="w-4 h-4 mr-2" /> Refresh Queue
                </Button>
              </form>
            </div>
          ) : (
            batches.map((batch: any) => {
              const orders = batch.delivery_batch_orders?.map((bo: any) => bo.orders) || [];
              const allDelivered = orders.every((o: any) => o.status === 'DELIVERED' || o.status === 'FAILED_DELIVERY');
              
              return (
                <div key={batch.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-900 px-5 py-4 flex justify-between items-center text-white">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-indigo-400 mr-3" />
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Batch ID</div>
                        <div className="font-mono text-sm">{batch.id.split('-')[0].toUpperCase()}</div>
                      </div>
                    </div>
                    {batch.status === 'PENDING' ? (
                      <form action={async () => { 'use server'; await updateBatchStatus(batch.id, 'IN_PROGRESS'); revalidatePath('/delivery'); }}>
                        <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs h-9 px-4">
                          Start Delivery Run
                        </Button>
                      </form>
                    ) : allDelivered ? (
                      <form action={async () => { 'use server'; await updateBatchStatus(batch.id, 'COMPLETED'); revalidatePath('/delivery'); }}>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs h-9 px-4">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Complete Batch
                        </Button>
                      </form>
                    ) : (
                      <div className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-full flex items-center border border-indigo-500/30">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse mr-2" />
                        In Progress
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100">
                    {orders.map((order: any, index: number) => {
                      const snapshot = order.delivery_address_snapshot as any;
                      const isCompleted = order.status === 'DELIVERED' || order.status === 'FAILED_DELIVERY';
                      
                      return (
                        <div key={order.id} className={`p-5 transition-opacity ${isCompleted ? 'opacity-60 bg-slate-50' : ''}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 shrink-0 ${isCompleted ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-700'}`}>
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">Order #{order.id.split('-')[0].toUpperCase()}</h4>
                                <div className="text-xs font-medium text-slate-500 mt-0.5">Collect: ${order.total.toFixed(2)} COD</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                                order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                                order.status === 'FAILED_DELIVERY' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 flex items-start space-x-3 ml-9">
                            <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{snapshot?.address_type || 'Address'} - {snapshot?.zone_id?.substring(0,8) /* Mocking zone name if not mapped */}</div>
                              <div className="text-slate-600 text-sm mt-0.5">{snapshot?.address_line1}</div>
                              {snapshot?.address_line2 && <div className="text-slate-500 text-sm">{snapshot.address_line2}</div>}
                              {snapshot?.landmark && (
                                <div className="text-xs font-semibold text-amber-600 mt-1.5 flex items-center">
                                  <AlertCircle className="w-3 h-3 mr-1" /> Landmark: {snapshot.landmark}
                                </div>
                              )}
                            </div>
                          </div>

                          {batch.status === 'IN_PROGRESS' && !isCompleted && (
                            <div className="flex space-x-2 ml-9 mt-2">
                              <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'DELIVERED'); revalidatePath('/delivery'); }} className="flex-1">
                                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10 shadow-sm">
                                  Delivered
                                </Button>
                              </form>
                              <form action={async () => { 'use server'; await updateOrderStatus(order.id, 'FAILED_DELIVERY'); revalidatePath('/delivery'); }}>
                                <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-bold h-10 px-3">
                                  Fail
                                </Button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
