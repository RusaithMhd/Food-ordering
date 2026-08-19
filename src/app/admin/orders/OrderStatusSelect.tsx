'use client';

import { useState } from 'react';
import { updateAdminOrderStatus } from '@/actions/admin/orders';
import { Loader2 } from 'lucide-react';

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'FAILED_DELIVERY',
];

function getStatusColor(status: string) {
  switch (status) {
    case 'PLACED': return 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-200';
    case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-200';
    case 'PREPARING': return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-200';
    case 'READY': return 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-200';
    case 'OUT_FOR_DELIVERY': return 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-200';
    case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-200';
    case 'CANCELLED': 
    case 'FAILED_DELIVERY':
      return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-200';
  }
}

export function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    const result = await updateAdminOrderStatus(orderId, newStatus);
    if (result.success) {
      setStatus(newStatus);
    } else {
      alert(result.error || 'Failed to update order status');
      setStatus(status); // Reset to previous
    }
    setLoading(false);
  };

  return (
    <div className="relative inline-flex items-center">
      {loading && (
        <span className="absolute -left-6">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        </span>
      )}
      <select
        value={status}
        disabled={loading}
        onChange={(e) => handleStatusChange(e.target.value)}
        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border outline-none cursor-pointer transition-all duration-200 focus:ring-2 disabled:opacity-50 appearance-none pr-8 relative ${getStatusColor(status)}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt} className="bg-white text-slate-900 font-semibold normal-case">
            {opt.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-[10px]">
        ▼
      </span>
    </div>
  );
}
