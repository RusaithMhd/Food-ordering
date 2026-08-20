import { createAdminClient } from '@/lib/supabase/server';
import { createCategory, updateCategory, deleteCategory } from '@/actions/admin/categories';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { Tags, Plus, RefreshCw, Trash2, Edit2, X } from 'lucide-react';
import Link from 'next/link';

async function getCategoryData() {
  const supabase = await createAdminClient();
  
  const { data: branches } = await supabase.from('branches').select('id, name').order('name');
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*, branches(name)')
    .order('created_at', { ascending: false });

  return { branches: branches || [], categories: categories || [] };
}

export default async function CategoryManagementPage(props: { searchParams: Promise<{ edit?: string }> }) {
  const searchParams = await props.searchParams;
  const { branches, categories } = await getCategoryData();
  
  const editId = searchParams?.edit;
  const editCategory = editId ? categories?.find(c => c.id === editId) : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 select-none">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center">
            <Tags className="w-8 h-8 mr-3 text-rose-500" />
            Category Management
          </h1>
          <p className="text-slate-400 mt-1.5 font-medium">Create and manage menu categories (e.g., Appetizers, Desserts) for your kitchens.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Add/Edit Category Form */}
        <div className="xl:col-span-1 h-fit">
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800/80 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-red-650" />
            <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
              <span className="flex items-center">
                {editCategory ? <Edit2 className="w-5 h-5 mr-2.5 text-rose-500 animate-pulse" /> : <Tags className="w-5 h-5 mr-2.5 text-rose-500" />}
                {editCategory ? 'Edit Category' : 'Add New Category'}
              </span>
              {editCategory && (
                <Link href="/admin/categories">
                  <Button variant="ghost" size="sm" className="text-slate-550 hover:text-slate-300">
                    <X className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </h2>
            
            <form action={async (fd) => { 'use server'; if (editCategory) { await updateCategory(fd); } else { await createCategory(fd); } }} className="space-y-5">
              {editCategory && <input type="hidden" name="id" value={editCategory.id} />}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Category Name <span className="text-rose-500">*</span></label>
                <input type="text" name="name" defaultValue={editCategory?.name || ''} required className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all duration-300" placeholder="e.g. Signature Cocktails" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                <textarea name="description" defaultValue={editCategory?.description || ''} rows={2} className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none duration-300" placeholder="A brief description of this category..."></textarea>
              </div>

              {!editCategory && <input type="hidden" name="branch_id" value={branches[0]?.id || ''} />}

              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 border border-slate-850 shadow-md hover:shadow-lg hover:shadow-slate-950/10 active:scale-[0.98] transition-all mt-2">
                {editCategory ? (
                  <><Edit2 className="w-4 h-4 mr-2" /> Save Changes</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Add Category</>
                )}
              </Button>
              {editCategory && (
                <Link href="/admin/categories">
                  <Button type="button" variant="outline" className="w-full mt-2 h-12 rounded-xl text-sm font-bold bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-800 hover:text-white">
                    Cancel
                  </Button>
                </Link>
              )}
            </form>
          </div>
        </div>

        {/* Existing Categories Table */}
        <div className="xl:col-span-2">
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800/80 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Tags className="w-5 h-5 mr-2 text-slate-500" />
                Current Categories
              </h2>
              <form action={async () => { 'use server'; revalidatePath('/admin/categories'); }}>
                 <Button variant="outline" size="sm" className="rounded-full font-bold border-slate-850 bg-slate-950/40 text-slate-450 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                   <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
                 </Button>
              </form>
            </div>
            
            {/* Desktop View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-850">
              <table className="min-w-full divide-y divide-slate-850/50">
                <thead className="bg-slate-950/40">
                  <tr className="select-none">
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Category Name</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/0 divide-y divide-slate-850/40 text-sm">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-16 text-center text-slate-500 font-semibold">
                        <Tags className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                        No categories found. Add your first category!
                      </td>
                    </tr>
                  ) : categories.map((cat) => (
                    <tr key={cat.id} className={`hover:bg-slate-900/10 transition-all duration-300 group ${editCategory?.id === cat.id ? 'bg-rose-500/5' : ''}`}>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center mr-4 border border-rose-500/15 text-rose-500">
                            <Tags className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-white">{cat.name}</div>
                            {cat.description && <div className="text-xs font-semibold text-slate-400/90 mt-0.5 truncate max-w-[220px]">{cat.description}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                          <Link href={`/admin/categories?edit=${cat.id}`}>
                            <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-all font-bold">
                              <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                            </Button>
                          </Link>
                          <form action={async () => { 'use server'; await deleteCategory(cat.id); }}>
                            <Button type="submit" variant="ghost" size="sm" className="text-rose-450 hover:text-rose-455 hover:bg-rose-500/10 rounded-xl transition-all font-bold">
                              <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-850/50 border border-slate-850 rounded-2xl overflow-hidden bg-slate-900/10">
              {categories.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-semibold text-sm">
                  <Tags className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                  No categories found. Add your first category!
                </div>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className={`p-4 flex flex-col gap-3 transition-colors ${editCategory?.id === cat.id ? 'bg-rose-500/5' : ''}`}>
                    <div className="flex items-center space-x-3.5">
                      <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/15 text-rose-500 shrink-0">
                        <Tags className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold text-white truncate">{cat.name}</div>
                        {cat.description && <div className="text-xs font-semibold text-slate-400 mt-0.5 leading-relaxed">{cat.description}</div>}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 border-t border-slate-850/40 pt-2.5">
                      <Link href={`/admin/categories?edit=${cat.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-indigo-400 hover:text-indigo-300 hover:bg-slate-900 border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center h-9">
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                      </Link>
                      <form action={async () => { 'use server'; await deleteCategory(cat.id); }} className="flex-1">
                        <Button type="submit" variant="outline" size="sm" className="w-full text-rose-500 hover:text-rose-455 hover:bg-slate-900 border-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center h-9">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
