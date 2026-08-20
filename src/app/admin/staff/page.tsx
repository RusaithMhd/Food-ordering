import { createAdminClient } from '@/lib/supabase/server';
import { revokeRole } from '@/actions/admin/staff';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { Users, UserPlus, RefreshCw, ShieldOff, Mail } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { InviteForm } from './InviteForm';

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

export default async function StaffManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { roles, staff } = await getStaffData();
  const resolvedParams = await searchParams;
  const activeFilter = resolvedParams.role || 'all';

  // Filter entries based on active filter
  const filteredStaff = staff.filter((s: any) => {
    const roleName = s.roles?.name;
    if (activeFilter === 'staff') {
      return roleName !== 'CUSTOMER';
    }
    if (activeFilter === 'customer') {
      return roleName === 'CUSTOMER';
    }
    return true; // 'all'
  });

  const totalCount = staff.length;
  const staffCount = staff.filter((s: any) => s.roles?.name !== 'CUSTOMER').length;
  const customerCount = staff.filter((s: any) => s.roles?.name === 'CUSTOMER').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Staff & Users</h1>
        <p className="text-slate-500 mt-1.5 font-medium">Assign access roles (KITCHEN, DELIVERY, MANAGER) to your employees or view registered customers.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Assign Role Form */}
        <div className="xl:col-span-1 h-fit">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
              Invite Staff
            </h2>
            <div className="flex items-start bg-indigo-50 text-indigo-850 p-4 rounded-2xl mb-6 border border-indigo-100/50">
              <Mail className="w-4 h-4 mr-2.5 mt-0.5 shrink-0 text-indigo-500" />
              <p className="text-xs font-semibold leading-relaxed">If the user is not in the system yet, an invitation email will be sent automatically to let them set their password.</p>
            </div>
            <InviteForm roles={roles} />
          </div>
        </div>

        {/* Existing Staff Table */}
        <div className="xl:col-span-2">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-slate-400" />
                User List
              </h2>
              
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto select-none">
                <Link
                  href="/admin/staff?role=all"
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    activeFilter === 'all' 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  All ({totalCount})
                </Link>
                <Link
                  href="/admin/staff?role=staff"
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    activeFilter === 'staff' 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Staff ({staffCount})
                </Link>
                <Link
                  href="/admin/staff?role=customer"
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                    activeFilter === 'customer' 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Customers ({customerCount})
                </Link>
              </div>

              <form action={async () => { 'use server'; revalidatePath('/admin/staff'); }} className="hidden md:block">
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
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-12 text-center text-slate-400 font-medium">
                        <Users className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                        No members found matching filter.
                      </td>
                    </tr>
                  ) : filteredStaff.map((s: any) => (
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
                        <span className={cn(
                          "px-3 py-1 text-xs font-bold rounded-full border",
                          s.roles?.name === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          s.roles?.name === 'MANAGER' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          s.roles?.name === 'KITCHEN' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          s.roles?.name === 'CUSTOMER' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                        )}>
                          {s.roles?.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {s.roles?.name !== 'SUPER_ADMIN' ? (
                          <form action={async () => { 'use server'; await revokeRole(s.user_id); }}>
                            <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-bold">
                              <ShieldOff className="w-4 h-4 mr-1.5" /> Revoke
                            </Button>
                          </form>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 px-3">System</span>
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
