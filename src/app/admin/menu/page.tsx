import { createAdminClient } from '@/lib/supabase/server';
import { createMenuItem, deleteMenuItem } from '@/actions/admin/menu';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { UtensilsCrossed, Plus, RefreshCw, Trash2, Leaf, Image as ImageIcon } from 'lucide-react';

async function getAdminMenuData() {
  const supabase = await createAdminClient();
  
  // Get all branches (for the dropdown)
  const { data: branches } = await supabase.from('branches').select('id, name').order('name');
  
  // Get all categories (for the dropdown)
  const { data: categories } = await supabase.from('categories').select('id, name, branch_id').order('name');
  
  // Get all items
  const { data: items } = await supabase
    .from('menu_items')
    .select('*, categories(name), branches(name)')
    .order('created_at', { ascending: false });

  return { branches: branches || [], categories: categories || [], items: items || [] };
}

export default async function AdminMenuPage() {
  const { branches, categories, items } = await getAdminMenuData();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Menu Management</h1>
        <p className="text-slate-500 mt-1.5 font-medium">Add, edit, or remove delicious items from your menus.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Add New Item Form */}
        <div className="xl:col-span-1 h-fit">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <UtensilsCrossed className="w-5 h-5 mr-2 text-amber-500" />
              Add New Item
            </h2>
            
            <form action={async (fd) => { 'use server'; await createMenuItem(fd); }} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Item Name <span className="text-rose-500">*</span></label>
                <input type="text" name="name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" placeholder="e.g. Signature Wagyu Burger" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea name="description" rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none" placeholder="A mouth-watering description..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price ($) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input type="number" step="0.01" name="base_price" required className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prep Time</label>
                  <div className="relative">
                    <input type="number" name="preparation_time" defaultValue="15" className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">min</span>
                  </div>
                </div>
              </div>

              <input type="hidden" name="branch_id" value={branches[0]?.id || ''} />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category <span className="text-rose-500">*</span></label>
                <select name="category_id" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer">
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Image URL</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <input type="url" name="image_url" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" placeholder="https://..." />
                </div>
              </div>

              <div className="flex items-center p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <input type="checkbox" name="is_vegetarian" id="is_vegetarian" className="h-5 w-5 text-amber-500 focus:ring-amber-500 border-slate-300 rounded cursor-pointer" />
                <label htmlFor="is_vegetarian" className="ml-3 block text-sm font-semibold text-slate-700 cursor-pointer flex items-center">
                  Vegetarian <Leaf className="w-4 h-4 ml-1.5 text-emerald-500" />
                </label>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all mt-2">
                <Plus className="w-4 h-4 mr-2" /> Add Menu Item
              </Button>
            </form>
          </div>
        </div>

        {/* Existing Items Table */}
        <div className="xl:col-span-2">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Current Menu</h2>
              <form action={async () => { 'use server'; revalidatePath('/admin/menu'); }}>
                 <Button variant="outline" size="sm" className="rounded-full font-medium border-slate-200 hover:bg-slate-50">
                   <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
                 </Button>
              </form>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item Details</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400 font-medium">
                        <UtensilsCrossed className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                        No items found. Add your first dish!
                      </td>
                    </tr>
                  ) : items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.image_url ? (
                            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm border border-slate-100 shrink-0 mr-4">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" src={item.image_url} alt="" />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mr-4 border border-slate-100 border-dashed text-[10px] font-bold text-slate-400 uppercase">
                              No Img
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center">
                              {item.name}
                              {item.is_vegetarian && <span title="Vegetarian"><Leaf className="w-3.5 h-3.5 ml-1.5 text-emerald-500" /></span>}
                            </div>
                            </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-900 font-extrabold">
                        ${item.base_price.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {item.categories?.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <form action={async () => { 'use server'; await deleteMenuItem(item.id); }}>
                          <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
