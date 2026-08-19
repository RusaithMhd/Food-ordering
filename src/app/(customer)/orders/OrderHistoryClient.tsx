'use client';

import { useState } from 'react';
import { Clock, Package, MapPin, Phone, User, Bike, CalendarDays, Filter, CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  PLACED:           { label: 'Order Placed',     color: 'bg-blue-500',    step: 1 },
  CONFIRMED:        { label: 'Confirmed',        color: 'bg-blue-600',    step: 1 },
  PREPARING:        { label: 'Cooking',          color: 'bg-amber-500',   step: 2 },
  READY:            { label: 'Out for Delivery', color: 'bg-purple-500',  step: 3 },
  OUT_FOR_DELIVERY: { label: 'On the way',       color: 'bg-purple-600',  step: 3 },
  DELIVERED:        { label: 'Delivered',        color: 'bg-emerald-500', step: 4 },
  CANCELLED:        { label: 'Cancelled',        color: 'bg-rose-500',    step: 0 },
};

function formatDateGroup(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export function OrderHistoryClient({ initialOrders }: { initialOrders: any[] }) {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PAST'>('ALL');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const filteredOrders = initialOrders.filter((order: any) => {
    // 1. Status Filter
    const isActive = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
    if (filter === 'ACTIVE' && !isActive) return false;
    if (filter === 'PAST' && isActive) return false;

    // 2. Date Filter
    if (selectedDate) {
      const orderDateObj = new Date(order.placed_at);
      if (
        orderDateObj.getFullYear() !== selectedDate.getFullYear() ||
        orderDateObj.getMonth() !== selectedDate.getMonth() ||
        orderDateObj.getDate() !== selectedDate.getDate()
      ) {
        return false;
      }
    }

    return true;
  });

  // Group by date
  const groupedOrders = filteredOrders.reduce((acc, order: any) => {
    const group = formatDateGroup(order.placed_at);
    if (!acc[group]) acc[group] = [];
    acc[group].push(order);
    return acc;
  }, {} as Record<string, typeof initialOrders>);

  if (initialOrders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
          <Package className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No orders yet</h3>
        <p className="text-slate-500 mb-6">Looks like you haven&apos;t placed any delivery orders yet.</p>
        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-colors">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 mb-6">
        {/* Segmented Control Filter */}
        <div className="bg-slate-200/50 p-1 rounded-xl flex items-center">
          {['ALL', 'ACTIVE', 'PAST'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                filter === f 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'ACTIVE' ? 'Active' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Beautiful Date Picker */}
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger>
              <div
                className={`flex items-center flex-1 justify-start text-left font-bold rounded-xl px-4 py-3 border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer ${!selectedDate && "text-slate-500"}`}
              >
                <CalendarIcon className="mr-2 h-5 w-5 opacity-70" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date to filter</span>}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border-slate-200" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-3"
              />
            </PopoverContent>
          </Popover>

          {selectedDate && (
            <button 
              onClick={() => setSelectedDate(undefined)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 border-dashed">
          <p className="text-slate-400 font-medium">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedOrders).map(([dateGroup, ordersInGroup]: [string, any]) => (
            <div key={dateGroup} className="relative">
              {/* Clean Sticky Date Header */}
              <div className="sticky top-[56px] md:top-[80px] z-10 bg-[#F8F9FA]/95 backdrop-blur-md py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">{dateGroup}</h2>
              </div>

              <div className="space-y-5">
                {ordersInGroup.map((order: any) => {
                  const isActive = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
                  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'bg-slate-500', step: 0 };
                  const snapshot = order.delivery_address_snapshot as any;

                  const addressLine = snapshot?.address_line1
                    ? `${snapshot.address_line1}${snapshot.address_line2 ? `, ${snapshot.address_line2}` : ''}`
                    : null;
                  const addressType = snapshot?.address_type?.replace(/_/g, ' ') ?? null;
                  const recipientName = snapshot?.recipient_name ?? null;
                  const phone = snapshot?.phone ?? null;
                  const deliveryFee = snapshot?.delivery_fee ?? order.delivery_fee ?? 0;

                  return (
                    <div key={order.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                      {/* Header */}
                      <div className={`p-5 border-b border-slate-100 ${isActive ? 'bg-blue-50/30' : 'bg-white'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <span className="font-bold text-slate-900 text-base">{order.branches?.name ?? 'Restaurant'}</span>
                              <span className={`px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full text-white ${statusCfg.color}`}>
                                {statusCfg.label}
                              </span>
                            </div>
                            <div className="text-xs font-medium text-slate-400 flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xl font-black text-slate-900">${order.total.toFixed(2)}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Cash on Delivery</div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {isActive && statusCfg.step > 0 && (
                        <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-100">
                          <div className="overflow-hidden h-1.5 rounded-full bg-slate-200 mb-3">
                            <div
                              style={{ width: `${(statusCfg.step / 4) * 100}%` }}
                              className={`h-full rounded-full ${statusCfg.color} transition-all duration-700`}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-0.5">
                            {['Placed', 'Cooking', 'On the way', 'Delivered'].map((label, i) => (
                              <span key={label} className={statusCfg.step === i + 1 ? 'text-slate-700' : ''}>{label}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div className="p-5">
                        <div className="space-y-3 mb-5">
                          {order.order_items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                {item.menu_items?.image_url ? (
                                  <div 
                                    className="w-full h-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${item.menu_items.image_url})` }}
                                  />
                                ) : (
                                  <Package className="w-4 h-4 text-slate-300" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-slate-900 text-sm">
                                  <span className="text-slate-500 font-bold mr-1.5">{item.quantity}x</span>
                                  {item.menu_items?.name}
                                </div>
                              </div>
                              <div className="font-bold text-slate-700 text-sm">${item.total_price.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-medium">Subtotal</span>
                            <span className="font-semibold text-slate-700">${order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-medium flex items-center">
                              <Bike className="w-3 h-3 mr-1" /> Delivery Fee
                            </span>
                            <span className="font-semibold text-slate-700">${Number(deliveryFee).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm pt-2 border-t border-slate-200 mt-2">
                            <span className="font-bold text-slate-900">Total</span>
                            <span className="font-black text-slate-900">${order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Delivery Details
                          </p>
                          {addressLine ? (
                            <div className="space-y-2">
                              {addressType && (
                                <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                                  {addressType}
                                </span>
                              )}
                              <p className="text-sm font-semibold text-slate-900">{addressLine}</p>
                              <div className="flex flex-wrap gap-3 mt-1">
                                {recipientName && (
                                  <div className="flex items-center text-xs text-slate-600 space-x-1">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-semibold">{recipientName}</span>
                                  </div>
                                )}
                                {phone && (
                                  <div className="flex items-center text-xs text-slate-600 space-x-1">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-medium">{phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 font-medium italic">No delivery address recorded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
