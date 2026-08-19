'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';
import Link from 'next/link';

interface OrderSearchFormProps {
  initialPhone: string;
  statusFilter: string;
  dateRangeFilter: string;
}

export function OrderSearchForm({ initialPhone, statusFilter, dateRangeFilter }: OrderSearchFormProps) {
  const [phone, setPhone] = useState(initialPhone);
  const router = useRouter();

  // Sync state if initialPhone changes from server side
  useEffect(() => {
    setPhone(initialPhone);
  }, [initialPhone]);

  // Debounced auto-filter as the user types
  useEffect(() => {
    if (phone === initialPhone) return;

    const timer = setTimeout(() => {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      router.push(`/admin/orders?status=${statusFilter}&date_range=${dateRangeFilter}&phone=${encodeURIComponent(cleanPhone)}`);
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [phone, initialPhone, statusFilter, dateRangeFilter, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    router.push(`/admin/orders?status=${statusFilter}&date_range=${dateRangeFilter}&phone=${encodeURIComponent(cleanPhone)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div className="relative flex-1">
        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={phone}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9+]/g, '');
            setPhone(val);
          }}
          placeholder="Search orders by Phone Number (filters automatically)..."
          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>
      
      <div className="flex gap-2 shrink-0">
        <button 
          type="submit"
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 active:scale-95 flex-1 sm:flex-none"
        >
          Search
        </button>
        
        {phone && (
          <Link 
            href={`/admin/orders?status=${statusFilter}&date_range=${dateRangeFilter}`}
            onClick={() => setPhone('')}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all text-center flex-1 sm:flex-none"
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
