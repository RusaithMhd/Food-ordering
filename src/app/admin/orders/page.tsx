import { getAdminOrders } from '@/actions/admin/orders';
import { ShoppingBag, Calendar, Phone, CheckCircle2, AlertCircle, User as UserIcon, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { OrderStatusSelect } from './OrderStatusSelect';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminCreateOrderDialog } from './AdminCreateOrderDialog';
import { OrderSearchForm } from './OrderSearchForm';
import { PrintReceiptButton } from '@/components/PrintReceiptButton';

export const metadata = {
  title: 'Manage Orders - Admin',
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ status?: string; date_range?: string; phone?: string }>;
}) {
  const searchParams = await props.searchParams;
  const statusFilter = searchParams?.status || 'ALL';
  const dateRangeFilter = searchParams?.date_range || 'TODAY';
  const phoneFilter = searchParams?.phone || '';
  
  const supabase = await createAdminClient();

  const [orders, menuItemsRes, profilesRes, pastGuestsRes, hotelsRes] = await Promise.all([
    getAdminOrders(statusFilter, dateRangeFilter, phoneFilter),
    supabase.from('menu_items').select('id, name, base_price').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name, phone_number').order('full_name'),
    supabase.from('orders').select('customer_id, delivery_address_snapshot').not('delivery_address_snapshot', 'is', null),
    supabase.from('hotels').select('name').limit(1),
  ]);

  const menuItems = menuItemsRes.data || [];
  const profiles = profilesRes.data || [];
  const pastGuests = pastGuestsRes.data || [];
  const hotelName = (hotelsRes.data?.[0]?.name) || 'Hotel Ordering';

  const profileAddresses = new Map<string, string>();
  const guestAddresses = new Map<string, string>();

  for (const order of pastGuests) {
    const snap = order.delivery_address_snapshot as any;
    const address = snap?.address_line1
      ? `${snap.address_line1}${snap.address_line2 ? `, ${snap.address_line2}` : ''}`
      : '';
    if (address) {
      if (order.customer_id) {
        profileAddresses.set(order.customer_id, address);
      }
      const phone = snap?.phone || '';
      if (phone) {
        guestAddresses.set(phone, address);
      }
    }
  }

  const seenPhones = new Set<string>();
  const mergedProfiles: { id: string; full_name: string | null; phone_number: string | null; is_guest: boolean; address_line: string }[] = [];

  for (const p of profiles) {
    mergedProfiles.push({
      id: p.id,
      full_name: p.full_name,
      phone_number: p.phone_number,
      is_guest: false,
      address_line: profileAddresses.get(p.id) || ''
    });
    if (p.phone_number) {
      seenPhones.add(p.phone_number);
    }
  }

  for (const order of pastGuests) {
    const snap = order.delivery_address_snapshot as any;
    const phone = snap?.phone || '';
    const name = snap?.recipient_name || '';
    if (phone && name && !seenPhones.has(phone)) {
      seenPhones.add(phone);
      mergedProfiles.push({
        id: `GUEST_${phone}`,
        full_name: name,
        phone_number: phone,
        is_guest: true,
        address_line: guestAddresses.get(phone) || ''
      });
    }
  }

  const stats = {
    total: orders?.length || 0,
    preparing: orders?.filter(o => o.status === 'PREPARING').length || 0,
    out: orders?.filter(o => o.status === 'OUT_FOR_DELIVERY').length || 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 select-none">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center">
            <ShoppingBag className="w-8 h-8 mr-3 text-indigo-400" />
            Order Management
          </h1>
          <p className="text-slate-400 mt-1.5 font-medium">View and manage all customer orders across your platform.</p>
        </div>
        <div>
          <AdminCreateOrderDialog menuItems={menuItems} profiles={mergedProfiles} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800/80 shadow-md flex items-center">
          <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center mr-4 border border-slate-850/80 text-slate-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Showing Orders</div>
            <div className="text-2xl font-black text-white">{stats.total}</div>
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800/80 shadow-md flex items-center">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mr-4 border border-amber-500/15 text-amber-400">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Currently Preparing</div>
            <div className="text-2xl font-black text-white">{stats.preparing}</div>
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800/80 shadow-md flex items-center">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mr-4 border border-purple-500/15 text-purple-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Out for Delivery</div>
            <div className="text-2xl font-black text-white">{stats.out}</div>
          </div>
        </div>
      </div>

      {/* Phone Number Search Form */}
      <OrderSearchForm 
        initialPhone={phoneFilter} 
        statusFilter={statusFilter} 
        dateRangeFilter={dateRangeFilter} 
      />

      <div className="bg-slate-900/50 backdrop-blur-md rounded-[2rem] border border-slate-800/80 shadow-md overflow-hidden">
        {/* Filter Bar */}
        <div className="p-5 border-b border-slate-850 bg-slate-950/20 flex flex-col gap-4">
          {/* Date Filter Segment */}
          <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest mr-3 select-none shrink-0">Time Range:</span>
            {[
              { label: "Today's Orders", value: 'TODAY' },
              { label: 'Past Orders', value: 'PAST' },
              { label: 'All Time', value: 'ALL' }
            ].map((range) => (
              <Link
                key={range.value}
                href={`/admin/orders?date_range=${range.value}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}${phoneFilter ? `&phone=${encodeURIComponent(phoneFilter)}` : ''}`}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                  dateRangeFilter === range.value 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10 scale-[1.03]' 
                    : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {range.label}
              </Link>
            ))}
          </div>

          {/* Status Filter Segment */}
          <div className="flex items-center space-x-2 overflow-x-auto hide-scrollbar border-t border-slate-850 pt-3.5">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest mr-3 select-none shrink-0">Status:</span>
            <Link
              href={`/admin/orders?date_range=${dateRangeFilter}${phoneFilter ? `&phone=${encodeURIComponent(phoneFilter)}` : ''}`}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                statusFilter === 'ALL' 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10 scale-[1.03]' 
                  : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-white'
              }`}
            >
              All Statuses
            </Link>
            {['PLACED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((status) => (
              <Link
                key={status}
                href={`/admin/orders?date_range=${dateRangeFilter}&status=${status}${phoneFilter ? `&phone=${encodeURIComponent(phoneFilter)}` : ''}`}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                  statusFilter === status 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10 scale-[1.03]' 
                    : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {formatStatus(status)}
              </Link>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-850 bg-slate-950/40 text-xs font-black text-slate-400 uppercase tracking-widest select-none">
                <th className="px-6 py-4 font-bold">Order Details</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Items</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 text-sm">
              {orders?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-semibold">
                    No orders found matching this status.
                  </td>
                </tr>
              ) : (
                orders?.map((order: any) => {
                  const snapshot = order.delivery_address_snapshot as any;
                  const recipientName = snapshot?.recipient_name || order.profiles?.full_name || 'Guest User';
                  const phone = snapshot?.phone || order.profiles?.phone_number || 'No phone';
                  const addressLine = snapshot?.address_line1
                    ? `${snapshot.address_line1}${snapshot.address_line2 ? `, ${snapshot.address_line2}` : ''}`
                    : null;

                  return (
                    <tr key={order.id} className="hover:bg-slate-900/10 transition-colors duration-300">
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col">
                          <span className="font-mono font-black text-white uppercase tracking-wider text-xs">#{order.id.split('-')[0]}</span>
                          <div className="flex items-center text-xs text-slate-500 mt-1 font-bold">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {new Date(order.placed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(order.placed_at).toLocaleDateString()}
                          </div>
                          {order.customer_note && (
                            <div className="mt-1.5 p-1.5 bg-indigo-500/5 text-indigo-400 text-xs border border-indigo-500/10 rounded-lg max-w-[200px] font-semibold">
                              <span className="font-black">Note:</span> {order.customer_note}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col space-y-1">
                          <span className="font-extrabold text-white flex items-center">
                            <UserIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                            {recipientName}
                          </span>
                          <span className="text-xs text-indigo-400 font-bold flex items-center bg-indigo-500/5 px-2 py-0.5 rounded-lg w-fit border border-indigo-500/10">
                            <Phone className="w-3 h-3 mr-1.5" />
                            {phone}
                          </span>
                          {addressLine && (
                            <span className="text-xs text-slate-400 font-semibold flex items-center mt-1">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-550 shrink-0" />
                              <span className="truncate max-w-[180px]" title={addressLine}>{addressLine}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col text-slate-400 text-xs font-semibold space-y-0.5">
                          {order.order_items?.slice(0, 2).map((item: any, i: number) => (
                            <div key={i} className="mb-1">
                              <div className="flex flex-wrap items-baseline">
                                <span className="font-bold text-white">{item.quantity}x</span> 
                                <span className="ml-1">{item.menu_items?.name}</span>
                                {item.quantity > 1 && (
                                  <span className="text-slate-500 ml-1">@ {Number(item.unit_price).toFixed(2)}</span>
                                )}
                              </div>
                              {item.notes && (
                                <div className="text-[10px] text-slate-500 mt-0.5 ml-4 leading-tight">{item.notes}</div>
                              )}
                            </div>
                          ))}
                          {order.order_items?.length > 2 && (
                            <div className="text-indigo-400 font-black mt-1">+{order.order_items.length - 2} more items</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="font-black text-white mb-2">LKR {Number(order.total).toFixed(2)}</div>
                        <PrintReceiptButton
                          variant="icon"
                          hotelName={hotelName}
                          order={{
                            id: order.id,
                            placed_at: order.placed_at,
                            status: order.status,
                            subtotal: Number(order.subtotal),
                            tax: Number(order.tax),
                            delivery_fee: Number(order.delivery_fee),
                            total: Number(order.total),
                            customer_note: order.customer_note,
                            recipient_name: (order.delivery_address_snapshot as any)?.recipient_name || order.profiles?.full_name || 'Guest',
                            phone: (order.delivery_address_snapshot as any)?.phone || order.profiles?.phone_number || '',
                            address: (order.delivery_address_snapshot as any)?.address_line1 || '',
                            items: (order.order_items || []).map((i: any) => ({
                              name: i.menu_items?.name || 'Item',
                              quantity: Number(i.quantity),
                              unit_price: Number(i.unit_price),
                              total_price: Number(i.total_price),
                            })),
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-850/50">
          {orders?.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-semibold text-sm">
              No orders found matching this status.
            </div>
          ) : (
            orders?.map((order: any) => {
              const snapshot = order.delivery_address_snapshot as any;
              const recipientName = snapshot?.recipient_name || order.profiles?.full_name || 'Guest User';
              const phone = snapshot?.phone || order.profiles?.phone_number || 'No phone';
              const addressLine = snapshot?.address_line1
                ? `${snapshot.address_line1}${snapshot.address_line2 ? `, ${snapshot.address_line2}` : ''}`
                : null;

              return (
                <div key={order.id} className="p-4 space-y-3 hover:bg-slate-900/10 transition-colors duration-300">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-white uppercase text-xs">#{order.id.split('-')[0]}</span>
                    <span className="font-black text-white">LKR {Number(order.total).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-slate-550 font-bold flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {new Date(order.placed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 flex flex-col space-y-1.5">
                    <span className="flex items-center font-extrabold text-white">
                      <UserIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                      {recipientName}
                    </span>
                    <span className="text-xs text-indigo-400 font-bold flex items-center bg-indigo-500/5 px-2 py-0.5 rounded-lg w-fit border border-indigo-500/10">
                      <Phone className="w-3 h-3 mr-1.5" />
                      {phone}
                    </span>
                    {addressLine && (
                      <span className="text-xs text-slate-400 font-medium flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-500 shrink-0" />
                        {addressLine}
                      </span>
                    )}
                  </div>
                  {order.customer_note && (
                    <div className="p-2.5 bg-indigo-500/5 text-indigo-400 text-xs border border-indigo-500/10 rounded-xl font-semibold">
                      <span className="font-black">Note:</span> {order.customer_note}
                    </div>
                  )}
                  <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                    {order.order_items?.map((item: any, i: number) => (
                      <div key={i} className="flex flex-col">
                        <div className="flex justify-between items-baseline">
                          <span>
                            <span className="font-bold text-white">{item.quantity}x</span> {item.menu_items?.name}
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-slate-500 ml-1">@ {Number(item.unit_price).toFixed(2)} ea</span>
                            )}
                          </span>
                          <span className="font-bold">LKR {Number(item.total_price).toFixed(2)}</span>
                        </div>
                        {item.notes && (
                          <div className="text-[10px] text-slate-500 mt-0.5 ml-4 leading-tight">{item.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <PrintReceiptButton
                    hotelName={hotelName}
                    order={{
                      id: order.id,
                      placed_at: order.placed_at,
                      status: order.status,
                      subtotal: Number(order.subtotal),
                      tax: Number(order.tax),
                      delivery_fee: Number(order.delivery_fee),
                      total: Number(order.total),
                      customer_note: order.customer_note,
                      recipient_name: (order.delivery_address_snapshot as any)?.recipient_name || order.profiles?.full_name || 'Guest',
                      phone: (order.delivery_address_snapshot as any)?.phone || order.profiles?.phone_number || '',
                      address: (order.delivery_address_snapshot as any)?.address_line1 || '',
                      items: (order.order_items || []).map((i: any) => ({
                        name: i.menu_items?.name || 'Item',
                        quantity: Number(i.quantity),
                        unit_price: Number(i.unit_price),
                        total_price: Number(i.total_price),
                      })),
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
