import { createAdminClient } from '@/lib/supabase/server';
import { parseClosingTimes } from '@/utils/closingTimes';
import { BarChart3, Clock, Flame, UtensilsCrossed, Tag } from 'lucide-react';
import { MealAccordion } from './MealAccordion';

export const revalidate = 0;

function parseMeals(desc: string | null | undefined): string[] {
  if (!desc) return ['breakfast', 'lunch', 'dinner'];
  const parts = desc.split('||meals:');
  if (parts.length < 2) return ['breakfast', 'lunch', 'dinner'];
  const mealPart = parts[1].split('||')[0];
  const meals = mealPart.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  return meals.length > 0 ? meals : ['breakfast', 'lunch', 'dinner'];
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export default async function AdminReportsPage() {
  const supabase = await createAdminClient();

  const { data: branches } = await supabase.from('branches').select('id, name, timezone').limit(1);
  const branch = branches?.[0] || null;
  const closingTimes = parseClosingTimes(branch?.timezone);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const bClose = timeToMinutes(closingTimes.breakfast);
  const lClose = timeToMinutes(closingTimes.lunch);
  const dClose = timeToMinutes(closingTimes.dinner);

  const breakfastStatus = !bClose ? 'upcoming' : currentMinutes >= bClose ? 'completed' : 'active';
  const lunchStatus = !lClose ? 'upcoming' : currentMinutes >= lClose ? 'completed' : (bClose && currentMinutes >= bClose ? 'active' : 'upcoming');
  const dinnerStatus = !dClose ? 'upcoming' : currentMinutes >= dClose ? 'completed' : (lClose && currentMinutes >= lClose ? 'active' : 'upcoming');

  // Fetch today's order items
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: rawItems } = await supabase
    .from('order_items')
    .select(`
      quantity,
      unit_price,
      total_price,
      orders!inner (
        placed_at,
        status
      ),
      menu_items (
        name,
        description
      )
    `)
    .gte('orders.placed_at', todayStart.toISOString())
    .neq('orders.status', 'CANCELLED');

  const items = (rawItems || []) as any[];

  function aggregateForMeal(mealKey: string) {
    const map = new Map<string, { name: string; price: number; quantity: number; revenue: number }>();
    for (const item of items) {
      const meals = parseMeals(item.menu_items?.description);
      if (!meals.includes(mealKey)) continue;
      const name = item.menu_items?.name || 'Unknown Item';
      const price = Number(item.unit_price || 0);
      const qty = Number(item.quantity || 0);
      const rev = Number(item.total_price || 0);
      const key = `${name}_${price}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += qty;
        existing.revenue += rev;
      } else {
        map.set(key, { name, price, quantity: qty, revenue: rev });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }

  const breakfastItems = aggregateForMeal('breakfast');
  const lunchItems = aggregateForMeal('lunch');
  const dinnerItems = aggregateForMeal('dinner');

  const totalQtyToday = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const totalRevToday = items.reduce((s, i) => s + Number(i.total_price || 0), 0);
  const distinctItems = new Set(items.map((i: any) => i.menu_items?.name)).size;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-12 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-indigo-400" />
            Daily Item Reports
          </h1>
          <p className="text-slate-400 mt-1.5 font-medium">
            Today's ordered quantities grouped by meal period. Click each section to expand.
            {branch && <span className="text-slate-600 ml-1">— {branch.name}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/50 border border-slate-800/80 px-4 py-2 rounded-2xl font-bold shrink-0">
          <Clock className="w-4 h-4 text-indigo-400" />
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <span className="text-slate-600 mx-1">|</span>
          {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-[1.8rem] border border-slate-800/80 shadow-md flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3 border border-indigo-500/15">
            <UtensilsCrossed className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalQtyToday}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Items Sold</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-[1.8rem] border border-slate-800/80 shadow-md flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 border border-emerald-500/15">
            <Flame className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">LKR {totalRevToday.toFixed(0)}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Revenue</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-[1.8rem] border border-slate-800/80 shadow-md flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 border border-amber-500/15">
            <Tag className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{distinctItems}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Distinct Items</div>
        </div>
      </div>

      {/* Collapsible Meal Period Accordions */}
      <div className="space-y-4">
        <MealAccordion
          mealKey="breakfast"
          label="Breakfast"
          iconName="coffee"
          closingTime={closingTimes.breakfast}
          status={breakfastStatus as any}
          items={breakfastItems}
          totalQty={breakfastItems.reduce((s, i) => s + i.quantity, 0)}
          totalRev={breakfastItems.reduce((s, i) => s + i.revenue, 0)}
        />
        <MealAccordion
          mealKey="lunch"
          label="Lunch"
          iconName="sun"
          closingTime={closingTimes.lunch}
          status={lunchStatus as any}
          items={lunchItems}
          totalQty={lunchItems.reduce((s, i) => s + i.quantity, 0)}
          totalRev={lunchItems.reduce((s, i) => s + i.revenue, 0)}
        />
        <MealAccordion
          mealKey="dinner"
          label="Dinner"
          iconName="moon"
          closingTime={closingTimes.dinner}
          status={dinnerStatus as any}
          items={dinnerItems}
          totalQty={dinnerItems.reduce((s, i) => s + i.quantity, 0)}
          totalRev={dinnerItems.reduce((s, i) => s + i.revenue, 0)}
        />
      </div>
    </div>
  );
}
