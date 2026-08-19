import { getAdminOrders, updateAdminOrderStatus } from '@/actions/admin/orders';
import { ShoppingBag, ChevronDown, Calendar, Phone, CheckCircle2, AlertCircle, Eye, ArrowRight, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

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
        <div className="overflow-x-auto">
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
                orders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900 uppercase">#{order.id.split('-')[0]}</span>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(order.placed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(order.placed_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 flex items-center">
                          <UserIcon className="w-3 h-3 mr-1 text-slate-400" />
                          {order.profiles?.full_name || 'Guest User'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {order.profiles?.phone_number || 'No phone'}
                        </span>
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
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-black text-slate-900">${Number(order.total).toFixed(2)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
