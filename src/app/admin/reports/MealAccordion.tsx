'use client';

import { useState } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemRow {
  name: string;
  price: number;
  quantity: number;
  revenue: number;
}

interface MealAccordionProps {
  mealKey: string;
  label: string;
  iconName: 'coffee' | 'sun' | 'moon';
  closingTime: string;
  status: 'completed' | 'active' | 'upcoming';
  items: ItemRow[];
  totalQty: number;
  totalRev: number;
}

const statusConfig = {
  completed: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
    label: 'Completed',
    border: 'border-emerald-500/20',
    glow: 'from-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400',
  },
  active: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
    label: 'Active Now',
    border: 'border-amber-500/20',
    glow: 'from-amber-500/5 to-transparent',
    iconBg: 'bg-amber-500/10 border-amber-500/15 text-amber-400',
  },
  upcoming: {
    badge: 'bg-slate-800/60 text-slate-400 border-slate-700/40',
    label: 'Upcoming',
    border: 'border-slate-800/60',
    glow: 'from-slate-800/10 to-transparent',
    iconBg: 'bg-slate-800/40 border-slate-700/40 text-slate-500',
  },
};

const MealIcons: Record<string, React.ReactNode> = {
  coffee: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" />
      <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" />
      <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round" />
    </svg>
  ),
  sun: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
      <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" />
      <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
    </svg>
  ),
  moon: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

export function MealAccordion({
  mealKey, label, iconName, closingTime, status, items, totalQty, totalRev,
}: MealAccordionProps) {
  const [open, setOpen] = useState(false);
  const config = statusConfig[status];

  return (
    <div className={cn(
      "bg-slate-900/50 backdrop-blur-md rounded-[2rem] border shadow-md overflow-hidden transition-all duration-300",
      config.border
    )}>
      {/* Clickable Header */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          "w-full text-left p-6 bg-gradient-to-r to-transparent cursor-pointer transition-colors duration-200 hover:bg-slate-950/10",
          config.glow
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0",
              config.iconBg
            )}>
              {MealIcons[iconName]}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-black text-white">{label}</h2>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider",
                  config.badge
                )}>
                  {status === 'active' && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />}
                  {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                {closingTime ? `Kitchen closes at ${closingTime}` : 'No closing time set'}
                {' '}· <span className="text-slate-600">{open ? 'Click to collapse' : 'Click to expand'}</span>
              </p>
            </div>
          </div>

          {/* Right side: totals + chevron */}
          <div className="flex items-center gap-4 sm:text-right">
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Qty</div>
              <div className="text-xl font-black text-white">{totalQty}</div>
            </div>
            <div className="border-l border-slate-850 pl-4">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue</div>
              <div className="text-xl font-black text-white">LKR {totalRev.toFixed(0)}</div>
            </div>
            <div className={cn(
              "ml-2 w-8 h-8 rounded-xl bg-slate-950/40 border border-slate-850 flex items-center justify-center transition-transform duration-300 shrink-0",
              open ? 'rotate-180' : ''
            )}>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      <div className={cn(
        "transition-all duration-400 overflow-hidden border-t border-slate-850/60",
        open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 border-transparent'
      )}>
        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-semibold text-sm">
            {status === 'upcoming'
              ? 'This meal period has not started yet.'
              : 'No items were ordered during this meal period.'}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-3 sm:px-6 py-2 sm:py-3.5">Item Name</th>
                    <th className="px-1 sm:px-6 py-2 sm:py-3.5 text-center">Price</th>
                    <th className="px-1 sm:px-6 py-2 sm:py-3.5 text-center leading-tight">Qty</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3.5 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50 text-xs sm:text-sm">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/10 transition-colors duration-300">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-extrabold text-white leading-tight min-w-[100px]">{item.name}</td>
                      <td className="px-1 sm:px-6 py-3 sm:py-4 text-center">
                        <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-xs font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 whitespace-nowrap">
                          LKR {item.price.toFixed(0)}
                        </span>
                      </td>
                      <td className="px-1 sm:px-6 py-3 sm:py-4 text-center">
                        <span className="text-lg sm:text-2xl font-black text-amber-400">{item.quantity}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-black text-white whitespace-nowrap">
                        LKR {item.revenue.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </div>
  );
}
