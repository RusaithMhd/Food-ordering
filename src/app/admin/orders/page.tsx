import { getAdminOrders, updateAdminOrderStatus } from '@/actions/admin/orders';
import { ShoppingBag, ChevronDown, Calendar, Phone, CheckCircle2, AlertCircle, Eye, ArrowRight, User as UserIcon, MapPin } from 'lucide-react';
import Link from 'next/link';
import { OrderStatusSelect } from './OrderStatusSelect';

export const metadata = {
  title: 'Manage Orders - Admin',
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PLACED': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'CONFIRMED': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'PREPARING': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'READY': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'OUT_FOR_DELIVERY': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'CANCELLED': 
    case 'FAILED_DELIVERY':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status || 'ALL';
  const orders = await getAdminOrders(statusFilter);

  const stats = {
    total: orders?.length || 0,
    preparing: orders?.filter(o => o.status === 'PREPARING').length || 0,
    out: orders?.filter(o => o.status === 'OUT_FOR_DELIVERY').length || 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center">
            <ShoppingBag className="w-8 h-8 mr-3 text-indigo-600" />
            Order Management
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">View and manage all customer orders across your platform.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mr-4">
            <ShoppingBag className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Showing Orders</div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mr-4">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Currently Preparing</div>
            <div className="text-2xl font-black text-slate-900">{stats.preparing}</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mr-4">
            <CheckCircle2 className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Out for Delivery</div>
            <div className="text-2xl font-black text-slate-900">{stats.out}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2 overflow-x-auto hide-scrollbar">
          <Link href="/admin/orders" className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
            All Orders
          </Link>
          {['PLACED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((status) => (
            <Link key={status} href={`/admin/orders?status=${status}`} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
              {formatStatus(status)}
            </Link>
          ))}
        </div>

        {/* Orders Table */}
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-bold">Order Details</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Items</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {orders?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
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
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-800">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-slate-900 uppercase">#{order.id.split('-')[0]}</span>
                          <div className="flex items-center text-xs text-slate-500 mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(order.placed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(order.placed_at).toLocaleDateString()}
                          </div>
                          {order.customer_note && (
                            <div className="mt-1.5 p-1.5 bg-indigo-50/50 rounded-lg text-indigo-700 text-xs border border-indigo-100/50 max-w-[200px]">
                              <span className="font-bold">Note:</span> {order.customer_note}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col space-y-1">
                          <span className="font-extrabold text-slate-900 flex items-center">
                            <UserIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                            {recipientName}
                          </span>
                          <span className="text-xs text-indigo-600 font-bold flex items-center bg-indigo-50/70 px-2 py-0.5 rounded-lg w-fit border border-indigo-100/50">
                            <Phone className="w-3 h-3 mr-1.5" />
                            {phone}
                          </span>
                          {addressLine && (
                            <span className="text-xs text-slate-700 font-semibold flex items-center mt-1">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]" title={addressLine}>{addressLine}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-slate-600 font-medium text-xs space-y-1">
                          {order.order_items?.slice(0, 2).map((item: any, i: number) => (
                            <div key={i}>{item.quantity}x {item.menu_items?.name}</div>
                          ))}
                          {order.order_items?.length > 2 && (
                            <div className="text-indigo-500 font-bold">+{order.order_items.length - 2} more items</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-black text-slate-900">LKR {Number(order.total).toFixed(2)}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {orders?.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm">
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
                <div key={order.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 uppercase">#{order.id.split('-')[0]}</span>
                    <span className="font-black text-slate-900">LKR {Number(order.total).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-semibold flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {new Date(order.placed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 flex flex-col space-y-1.5">
                    <span className="flex items-center font-extrabold text-slate-900">
                      <UserIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                      {recipientName}
                    </span>
                    <span className="text-xs text-indigo-700 font-bold flex items-center bg-indigo-50 px-2 py-0.5 rounded-lg w-fit border border-indigo-100">
                      <Phone className="w-3 h-3 mr-1.5" />
                      {phone}
                    </span>
                    {addressLine && (
                      <span className="text-xs text-slate-600 font-medium flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-400 shrink-0" />
                        {addressLine}
                      </span>
                    )}
                  </div>
                  {order.customer_note && (
                    <div className="p-2.5 bg-indigo-50/50 rounded-xl text-indigo-700 text-xs border border-indigo-100/50 font-medium">
                      <span className="font-bold">Note:</span> {order.customer_note}
                    </div>
                  )}
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                    {order.order_items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.quantity}x {item.menu_items?.name}</span>
                        <span className="font-bold">LKR {Number(item.total_price).toFixed(2)}</span>
                      </div>
                    ))}
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
