import { createAdminClient } from '@/lib/supabase/server';
import { createMenuItem, deleteMenuItem } from '@/actions/admin/menu';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Menu Management</h1>
        <p className="text-gray-500 mt-1">Add, edit, or remove items from your menus.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add New Item Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
          
          <form action={async (fd) => { 'use server'; await createMenuItem(fd); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm" placeholder="e.g. Wagyu Burger" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm" placeholder="Delicious beef burger..."></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                <input type="number" step="0.01" name="base_price" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
                <input type="number" name="preparation_time" defaultValue="15" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
              <select name="branch_id" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm bg-white">
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select name="category_id" required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm bg-white">
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input type="url" name="image_url" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm" placeholder="https://..." />
            </div>

            <div className="flex items-center">
              <input type="checkbox" name="is_vegetarian" id="is_vegetarian" className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded" />
              <label htmlFor="is_vegetarian" className="ml-2 block text-sm text-gray-900">
                Vegetarian
              </label>
            </div>

            <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white mt-4">Add Menu Item</Button>
          </form>
        </div>

        {/* Existing Items Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Existing Items</h2>
            <form action={async () => { 'use server'; revalidatePath('/admin/menu'); }}>
               <Button variant="outline" size="sm">Refresh</Button>
            </form>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No items found. Add one above.</td>
                  </tr>
                ) : items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="h-10 w-10 rounded object-cover mr-3" src={item.image_url} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3 text-xs text-gray-400">No Img</div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.branches?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ${item.base_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.categories?.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <form action={async () => { 'use server'; await deleteMenuItem(item.id); }}>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900 hover:bg-red-50">Delete</Button>
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
  );
}
