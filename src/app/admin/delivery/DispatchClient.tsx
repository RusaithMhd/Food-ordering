'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Package, Truck, Check, Loader2 } from 'lucide-react';
import { createDeliveryBatch } from '@/actions/delivery/batches';
import { useRouter } from 'next/navigation';

interface DispatchClientProps {
  readyOrders: any[];
  drivers: any[];
}

export function DispatchClient({ readyOrders, drivers }: DispatchClientProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const toggleOrder = (orderId: string) => {
    const next = new Set(selectedOrders);
    if (next.has(orderId)) next.delete(orderId);
    else next.add(orderId);
    setSelectedOrders(next);
  };

  const selectAll = () => {
    if (selectedOrders.size === readyOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(readyOrders.map(o => o.id)));
    }
  };

  const handleDispatch = async () => {
    if (selectedOrders.size === 0 || !selectedDriver) return;
    setIsSubmitting(true);
    
    const res = await createDeliveryBatch({
      driver_id: selectedDriver,
      order_ids: Array.from(selectedOrders)
    });

    setIsSubmitting(false);

    if (res.success) {
      setSelectedOrders(new Set());
      setSelectedDriver('');
      router.refresh();
    } else {
      alert(res.error || 'Failed to dispatch orders');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Orders Selection */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-indigo-500" />
              Ready for Delivery
            </h2>
            <p className="text-sm text-slate-500 font-medium">{readyOrders.length} orders waiting</p>
          </div>
          <Button 
            variant="outline" 
            onClick={selectAll}
            className="rounded-full text-xs font-bold"
          >
            {selectedOrders.size === readyOrders.length && readyOrders.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        {readyOrders.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            No orders are currently ready for delivery.
          </div>
        ) : (
          <div className="space-y-3">
            {readyOrders.map(order => {
              const isSelected = selectedOrders.has(order.id);
              const snap = order.delivery_address_snapshot || {};
              const address = `${snap.address_line1 || ''} ${snap.address_line2 || ''}`;
              
              return (
                <div 
                  key={order.id}
                  onClick={() => toggleOrder(order.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                    isSelected ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                    isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 bg-transparent'
                  }`}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">Order #{order.id.split('-')[0].toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      <span className="font-semibold text-slate-700">{snap.recipient_name || 'Customer'}</span>
                      {snap.phone && <span className="mx-2">•</span>}
                      {snap.phone && <span>{snap.phone}</span>}
                    </div>
                    <div className="text-sm text-slate-500 truncate mt-0.5">
                      {address || 'Walk-in / Dine-in'}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-black text-slate-900">LKR {order.total.toFixed(2)}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">
                      {new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispatch Panel */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 h-fit sticky top-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold">Dispatch Setup</h3>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
            Selected Orders
          </label>
          <div className="text-3xl font-black text-white">
            {selectedOrders.size}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
            Assign Driver
          </label>
          <select 
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl h-12 px-4 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Select a driver --</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.full_name} {driver.phone_number ? `(${driver.phone_number})` : ''}
              </option>
            ))}
          </select>
          {drivers.length === 0 && (
            <p className="text-amber-400 text-xs mt-2 font-medium">No active drivers found.</p>
          )}
        </div>

        <Button 
          onClick={handleDispatch}
          disabled={selectedOrders.size === 0 || !selectedDriver || isSubmitting}
          className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Dispatch Batch'
          )}
        </Button>
      </div>
    </div>
  );
}
