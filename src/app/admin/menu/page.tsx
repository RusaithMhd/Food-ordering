import { createAdminClient } from '@/lib/supabase/server';
import { createMenuItem, updateMenuItem, deleteMenuItem } from '@/actions/admin/menu';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { UtensilsCrossed, Plus, RefreshCw, Trash2, Leaf, Image as ImageIcon, Edit2, X } from 'lucide-react';
import Link from 'next/link';

async function getAdminMenuData() {
  const supabase = await createAdminClient();
  
  const [branchesRes, categoriesRes, itemsRes] = await Promise.all([
    supabase.from('branches').select('id, name').order('name'),
    supabase.from('categories').select('id, name, branch_id').order('name'),
    supabase.from('menu_items')
      .select('*, categories(name), branches(name)')
      .order('created_at', { ascending: false })
  ]);

  return { 
    branches: branchesRes.data || [], 
    categories: categoriesRes.data || [], 
    items: itemsRes.data || [] 
  };
}

const parseDescription = (desc: string | null | undefined) => {
  if (!desc) return { text: '', meals: ['breakfast', 'lunch', 'dinner'], prices: [] as number[] };
  const parts = desc.split('||meals:');
  const text = parts[0] || '';
  
  let meals = ['breakfast', 'lunch', 'dinner'];
  let prices: number[] = [];
  
  if (parts[1]) {
    const mealAndPrices = parts[1].split('||prices:');
    meals = mealAndPrices[0] ? mealAndPrices[0].split(',') : ['breakfast', 'lunch', 'dinner'];
    prices = mealAndPrices[1] ? mealAndPrices[1].split(',').map(Number).filter(n => !isNaN(n)) : [];
  }
  return { text, meals, prices };
};

export default async function AdminMenuPage(props: { searchParams: Promise<{ edit?: string }> }) {
  const searchParams = await props.searchParams;
  const { branches, categories, items } = await getAdminMenuData();
  
  const editId = searchParams?.edit;
  const editItem = editId ? items?.find(i => i.id === editId) : null;
  const { text: editDescText, meals: editMeals, prices: editPrices } = parseDescription(editItem?.description);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 select-none text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center">
            <UtensilsCrossed className="w-8 h-8 mr-3 text-amber-500" />
            Menu Management
          </h1>
          <p className="text-slate-400 mt-1.5 font-medium">Add, edit, or remove delicious items from your menus.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Add/Edit Item Form */}
        <div className="xl:col-span-1 h-fit">
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800/80 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
              <span className="flex items-center">
                {editItem ? <Edit2 className="w-5 h-5 mr-2.5 text-amber-500 animate-pulse" /> : <UtensilsCrossed className="w-5 h-5 mr-2.5 text-amber-500" />}
                {editItem ? 'Edit Menu Item' : 'Add New Item'}
              </span>
              {editItem && (
                <Link href="/admin/menu">
                  <Button variant="ghost" size="sm" className="text-slate-550 hover:text-slate-350">
                    <X className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </h2>
            
            <form action={async (fd) => { 'use server'; if (editItem) { await updateMenuItem(fd); } else { await createMenuItem(fd); } }} className="space-y-5">
              {editItem && <input type="hidden" name="id" value={editItem.id} />}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Item Name <span className="text-rose-500">*</span></label>
                <input type="text" name="name" defaultValue={editItem?.name || ''} required className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300" placeholder="e.g. Signature Wagyu Burger" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                <textarea name="description" defaultValue={editDescText} rows={2} className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none duration-300" placeholder="A mouth-watering description..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Price (LKR) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">LKR</span>
                    <input type="number" step="0.01" name="base_price" defaultValue={editItem?.base_price || ''} required className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-855 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Prep Time</label>
                  <div className="relative">
                    <input type="number" name="preparation_time" defaultValue={editItem?.preparation_time_minutes || '15'} className="w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-855 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">min</span>
                  </div>
                </div>
              </div>

              {!editItem && <input type="hidden" name="branch_id" value={branches[0]?.id || ''} />}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Category <span className="text-rose-500">*</span></label>
                <select name="category_id" defaultValue={editItem?.category_id || ''} required className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer duration-300">
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Price Options (Optional, comma-separated e.g. 100, 150, 200)</label>
                <input 
                  type="text" 
                  name="price_options" 
                  defaultValue={editPrices ? editPrices.join(', ') : ''} 
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300" 
                  placeholder="e.g. 100, 150, 200" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Image URL</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <input type="url" name="image_url" defaultValue={editItem?.image_url || ''} className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-855 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300" placeholder="https://..." />
                </div>
              </div>

              <div className="flex items-center p-4 rounded-xl border border-slate-850 bg-slate-950/40">
                <input type="checkbox" name="is_vegetarian" id="is_vegetarian" defaultChecked={editItem?.is_vegetarian} className="h-5 w-5 text-amber-500 focus:ring-amber-500 border-slate-800 bg-slate-950 rounded cursor-pointer" />
                <label htmlFor="is_vegetarian" className="ml-3 block text-sm font-semibold text-slate-350 cursor-pointer flex items-center select-none">
                  Vegetarian <Leaf className="w-4 h-4 ml-1.5 text-emerald-500" />
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Meal Availability</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center justify-center p-3 rounded-xl border border-slate-850 bg-slate-950/40">
                    <input type="checkbox" name="meal_breakfast" id="meal_breakfast" defaultChecked={editMeals.includes('breakfast')} className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-slate-800 bg-slate-950 rounded cursor-pointer" />
                    <label htmlFor="meal_breakfast" className="ml-2 block text-xs font-bold text-slate-300 cursor-pointer select-none">Breakfast</label>
                  </div>
                  <div className="flex items-center justify-center p-3 rounded-xl border border-slate-850 bg-slate-950/40">
                    <input type="checkbox" name="meal_lunch" id="meal_lunch" defaultChecked={editMeals.includes('lunch')} className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-slate-800 bg-slate-950 rounded cursor-pointer" />
                    <label htmlFor="meal_lunch" className="ml-2 block text-xs font-bold text-slate-300 cursor-pointer select-none">Lunch</label>
                  </div>
                  <div className="flex items-center justify-center p-3 rounded-xl border border-slate-850 bg-slate-950/40">
                    <input type="checkbox" name="meal_dinner" id="meal_dinner" defaultChecked={editMeals.includes('dinner')} className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-slate-800 bg-slate-950 rounded cursor-pointer" />
                    <label htmlFor="meal_dinner" className="ml-2 block text-xs font-bold text-slate-300 cursor-pointer select-none">Dinner</label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 border border-slate-850 shadow-md active:scale-[0.98] transition-all mt-2">
                {editItem ? (
                  <><Edit2 className="w-4 h-4 mr-2" /> Save Changes</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Add Menu Item</>
                )}
              </Button>
              {editItem && (
                <Link href="/admin/menu">
                  <Button type="button" variant="outline" className="w-full mt-2 h-12 rounded-xl text-sm font-bold bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-800 hover:text-white">
                    Cancel
                  </Button>
                </Link>
              )}
            </form>
          </div>
        </div>

        {/* Existing Items Table */}
        <div className="xl:col-span-2">
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800/80 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <UtensilsCrossed className="w-5 h-5 mr-2 text-slate-500" />
                Current Menu
              </h2>
              <form action={async () => { 'use server'; revalidatePath('/admin/menu'); }}>
                 <Button variant="outline" size="sm" className="rounded-full font-bold border-slate-855 bg-slate-950/40 text-slate-450 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                   <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
                 </Button>
              </form>
            </div>
            
            {/* Desktop View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-850">
              <table className="min-w-full divide-y divide-slate-850/50">
                <thead className="bg-slate-950/40">
                  <tr className="select-none">
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Item Details</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/0 divide-y divide-slate-850/40 text-sm">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-500 font-semibold">
                        <UtensilsCrossed className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                        No items found. Add your first dish!
                      </td>
                    </tr>
                  ) : items.map((item) => {
                    const { text: descText, meals } = parseDescription(item.description);

                    return (
                      <tr key={item.id} className={`hover:bg-slate-900/10 transition-all duration-300 group ${editItem?.id === item.id ? 'bg-amber-550/5' : ''}`}>
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.image_url ? (
                              <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm border border-slate-800 shrink-0 mr-4 bg-slate-950">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" src={item.image_url} alt="" />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-slate-950 flex items-center justify-center mr-4 border border-slate-850 border-dashed text-[9px] font-black text-slate-500 uppercase select-none">
                                No Img
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-extrabold text-white flex items-center">
                                {item.name}
                                {item.is_vegetarian && <span title="Vegetarian"><Leaf className="w-3.5 h-3.5 ml-1.5 text-emerald-500" /></span>}
                              </div>
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                {meals.includes('breakfast') && (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-450 border border-amber-500/15 tracking-wider">Breakfast</span>
                                )}
                                {meals.includes('lunch') && (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-450 border border-emerald-500/15 tracking-wider">Lunch</span>
                                )}
                                {meals.includes('dinner') && (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 tracking-wider">Dinner</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-sm text-white font-black">
                          LKR {item.base_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-950/40 text-slate-400 border border-slate-850 uppercase tracking-wide">
                            {item.categories?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                            <Link href={`/admin/menu?edit=${item.id}`}>
                              <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-all font-bold">
                                <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                              </Button>
                            </Link>
                            <form action={async () => { 'use server'; await deleteMenuItem(item.id); }}>
                              <Button type="submit" variant="ghost" size="sm" className="text-rose-500 hover:text-rose-455 hover:bg-rose-500/10 rounded-xl transition-all font-bold">
                                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-850/50 border border-slate-850 rounded-2xl overflow-hidden bg-slate-900/10">
              {items.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-semibold">
                  <UtensilsCrossed className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                  No items found. Add your first dish!
                </div>
              ) : (
                items.map((item) => {
                  const { text: descText, meals } = parseDescription(item.description);

                  return (
                    <div key={item.id} className={`p-4 flex gap-4 hover:bg-slate-900/10 transition-colors ${editItem?.id === item.id ? 'bg-amber-500/5' : ''}`}>
                      {item.image_url ? (
                        <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-sm border border-slate-800 shrink-0 bg-slate-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="h-full w-full object-cover" src={item.image_url} alt="" />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-850 border-dashed text-[9px] font-black text-slate-550 uppercase shrink-0">
                          No Img
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-sm font-extrabold text-white flex items-center flex-wrap gap-1 leading-tight">
                            {item.name}
                            {item.is_vegetarian && <span title="Vegetarian"><Leaf className="w-3.5 h-3.5 text-emerald-500" /></span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-slate-950/40 text-slate-405 border border-slate-850 uppercase tracking-wide">
                              {item.categories?.name}
                            </span>
                          </div>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {meals.includes('breakfast') && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-450 border border-amber-500/15">Breakfast</span>
                            )}
                            {meals.includes('lunch') && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-450 border border-emerald-500/15">Lunch</span>
                            )}
                            {meals.includes('dinner') && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">Dinner</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-slate-850/40">
                          <span className="text-sm text-white font-black">LKR {item.base_price.toFixed(2)}</span>
                          <div className="flex gap-1">
                            <Link href={`/admin/menu?edit=${item.id}`}>
                              <Button variant="ghost" size="xs" className="text-amber-400 hover:text-amber-300 hover:bg-slate-900 rounded-lg p-1.5">
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            <form action={async () => { 'use server'; await deleteMenuItem(item.id); }}>
                              <Button type="submit" variant="ghost" size="xs" className="text-rose-500 hover:text-rose-455 hover:bg-slate-900 rounded-lg p-1.5">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
