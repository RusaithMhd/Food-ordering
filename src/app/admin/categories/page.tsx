import { createAdminClient } from '@/lib/supabase/server';
import { createCategory, deleteCategory } from '@/actions/admin/categories';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { Tags, Plus, RefreshCw, Trash2, Store } from 'lucide-react';

async function getCategoryData() {
  const supabase = await createAdminClient();
  
  const { data: branches } = await supabase.from('branches').select('id, name').order('name');
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*, branches(name)')
    .order('created_at', { ascending: false });

  return { branches: branches || [], categories: categories || [] };
}

export default async function CategoryManagementPage() {
  const { branches, categories } = await getCategoryData();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Category Management</h1>
        <p className="text-slate-500 mt-1.5 font-medium">Create and manage menu categories (e.g., Appetizers, Desserts) for your kitchens.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Add New Category Form */}
        <div className="xl:col-span-1 h-fit">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-rose-500" />
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <Tags className="w-5 h-5 mr-2 text-rose-500" />
              Add New Category
            </h2>
            
            <form action={async (fd) => { 'use server'; await createCategory(fd); }} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category Name <span className="text-rose-500">*</span></label>
                <input type="text" name="name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" placeholder="e.g. Signature Cocktails" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea name="description" rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none" placeholder="A brief description of this category..."></textarea>
              </div>

              <input type="hidden" name="branch_id" value={branches[0]?.id || ''} />

              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all mt-2">
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            </form>
          </div>
        </div>

        {/* Existing Categories Table */}
        <div className="xl:col-span-2">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Current Categories</h2>
              <form action={async () => { 'use server'; revalidatePath('/admin/categories'); }}>
                 <Button variant="outline" size="sm" className="rounded-full font-medium border-slate-200 hover:bg-slate-50">
                   <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
                 </Button>
              </form>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category Name</th>

                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-5 py-12 text-center text-slate-400 font-medium">
                        <Tags className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                        No categories found. Add your first category!
                      </td>
                    </tr>
                  ) : categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center mr-4 border border-rose-100 text-rose-500">
                            <Tags className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{cat.name}</div>
                            {cat.description && <div className="text-xs font-medium text-slate-500 mt-0.5 truncate max-w-[200px]">{cat.description}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <form action={async () => { 'use server'; await deleteCategory(cat.id); }}>
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
