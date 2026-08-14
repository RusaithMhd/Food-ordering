import { createAdminClient } from '@/lib/supabase/server';
import { assignRole, revokeRole } from '@/actions/admin/staff';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { Users, UserPlus, RefreshCw, ShieldOff, ShieldAlert, BadgeCheck, Mail } from 'lucide-react';

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Staff Management</h1>
        <p className="text-slate-500 mt-1.5 font-medium">Assign access roles (KITCHEN, DELIVERY, MANAGER) to your employees.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Assign Role Form */}
        <div className="xl:col-span-1 h-fit">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
              Assign Role
            </h2>
            <div className="flex items-start bg-blue-50 text-blue-800 p-3 rounded-xl mb-6 border border-blue-100">
              <ShieldAlert className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
              <p className="text-xs font-medium">The user must sign in to the app via Google at least once before you can assign them a role.</p>
            </div>
            
            <form action={async (fd) => { 'use server'; await assignRole(fd); }} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Staff Email</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input type="email" name="email" required placeholder="e.g. chef@hotel.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Access Role</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <select name="role_id" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                    <option value="">Select Role</option>
                    {roles.filter(r => r.name !== 'CUSTOMER').map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all mt-2">
                <UserPlus className="w-4 h-4 mr-2" /> Grant Access
              </Button>
            </form>
          </div>
        </div>

        {/* Existing Staff Table */}
        <div className="xl:col-span-2">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-slate-400" />
                Current Staff Members
              </h2>
              <form action={async () => { 'use server'; revalidatePath('/admin/staff'); }}>
                <Button variant="outline" size="sm" className="rounded-full font-medium border-slate-200 hover:bg-slate-50">
                  <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
                </Button>
              </form>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User Details</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Role</th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-12 text-center text-slate-400 font-medium">
                        <Users className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                        No staff members found.
                      </td>
                    </tr>
                  ) : staff.map((s: any) => (
                    <tr key={s.user_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm uppercase border border-indigo-200">
                            {s.profiles?.full_name ? s.profiles.full_name.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{s.profiles?.full_name || 'No Name'}</div>
                            <div className="text-xs font-medium text-slate-500">{s.profiles?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                          s.roles?.name === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          s.roles?.name === 'MANAGER' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          s.roles?.name === 'KITCHEN' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {s.roles?.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {s.roles?.name !== 'SUPER_ADMIN' ? (
                          <form action={async () => { 'use server'; await revokeRole(s.user_id); }}>
                            <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                              <ShieldOff className="w-4 h-4 mr-1.5" /> Revoke
                            </Button>
                          </form>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 px-3">System</span>
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
    </div>
  );
}
