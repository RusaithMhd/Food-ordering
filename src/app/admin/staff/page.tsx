import { createAdminClient } from '@/lib/supabase/server';
import { assignRole, revokeRole } from '@/actions/admin/staff';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';

async function getStaffData() {
  const supabase = await createAdminClient();
  
  const { data: roles } = await supabase.from('roles').select('id, name');
  
  // Get all users who have a role assigned
  const { data: staff } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      roles ( name ),
      profiles ( full_name, email )
    `);

  return { 
    roles: roles || [], 
    staff: staff || [] 
  };
}

export default async function StaffManagementPage() {
  const { roles, staff } = await getStaffData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Staff Management</h1>
        <p className="text-gray-500 mt-1">Assign roles (KITCHEN, DELIVERY, MANAGER) to your employees.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Assign Role Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold mb-4">Assign Role</h2>
          <p className="text-sm text-gray-500 mb-4">The user must sign in to the app at least once before you can assign them a role.</p>
          
          <form action={async (fd) => { 'use server'; await assignRole(fd); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Email</label>
              <input type="email" name="email" required placeholder="e.g. chef@hotel.com" className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select name="role_id" required className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm bg-white">
                <option value="">Select Role</option>
                {roles.filter(r => r.name !== 'CUSTOMER').map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">Assign Role</Button>
          </form>
        </div>

        {/* Existing Staff Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Current Staff</h2>
            <form action={async () => { 'use server'; revalidatePath('/admin/staff'); }}>
              <Button variant="outline" size="sm">Refresh</Button>
            </form>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map((s: any) => (
                  <tr key={s.user_id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{s.profiles?.full_name || 'No Name'}</div>
                      <div className="text-sm text-gray-500">{s.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {s.roles?.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {s.roles?.name !== 'SUPER_ADMIN' && (
                        <form action={async () => { 'use server'; await revokeRole(s.user_id); }}>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900 hover:bg-red-50">Revoke</Button>
                        </form>
                      )}
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
