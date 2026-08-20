import { createAdminClient } from '@/lib/supabase/server';
import { revokeRole } from '@/actions/admin/staff';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { Users, UserPlus, RefreshCw, ShieldOff, Mail, Shield, Crown, ChefHat, Bike, User } from 'lucide-react';
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 select-none text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Staff & Users</h1>
          <p className="text-slate-400 mt-1.5 font-medium">Assign access roles (KITCHEN, DELIVERY, MANAGER) to your employees or view registered customers.</p>
        </div>
        <form action={async () => { 'use server'; revalidatePath('/admin/staff'); }}>
          <Button variant="outline" size="sm" className="rounded-2xl font-bold border-slate-850 bg-slate-950/40 text-slate-450 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh Data
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Invite/Assign Role Form */}
        <div className="xl:col-span-1 h-fit">
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800/80 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600" />
            <h2 className="text-xl font-extrabold text-white mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2.5 text-indigo-500" />
              Invite Staff
            </h2>
            <div className="flex items-start bg-indigo-500/5 backdrop-blur-sm text-indigo-400 p-4 rounded-2xl mb-6 border border-indigo-500/10">
              <Mail className="w-4 h-4 mr-2.5 mt-0.5 shrink-0 text-indigo-400" />
              <p className="text-xs font-bold leading-relaxed">If the user is not in the system yet, an invitation email will be sent automatically to let them set their password.</p>
            </div>
            
            <InviteForm roles={roles} />
          </div>
        </div>

        {/* Existing Users Table */}
        <div className="xl:col-span-2">
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800/80 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-slate-500" />
                Directory List
              </h2>
              
              {/* Premium Segmented Controls */}
              <div className="flex items-center space-x-1 bg-slate-950/40 backdrop-blur-md p-1.5 rounded-2xl select-none self-start sm:self-auto shadow-inner border border-slate-850/80">
                <Link
                  href="/admin/staff?role=all"
                  className={cn(
                    "px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 border border-transparent",
                    activeFilter === 'all' 
                      ? "bg-indigo-600 text-white border-indigo-650 shadow-md shadow-indigo-600/10 scale-[1.03]" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  All ({totalCount})
                </Link>
                <Link
                  href="/admin/staff?role=staff"
                  className={cn(
                    "px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 border border-transparent",
                    activeFilter === 'staff' 
                      ? "bg-indigo-600 text-white border-indigo-650 shadow-md shadow-indigo-600/10 scale-[1.03]" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Staff ({staffCount})
                </Link>
                <Link
                  href="/admin/staff?role=customer"
                  className={cn(
                    "px-4 py-2 text-xs font-black rounded-xl transition-all duration-300 border border-transparent",
                    activeFilter === 'customer' 
                      ? "bg-indigo-600 text-white border-indigo-650 shadow-md shadow-indigo-600/10 scale-[1.03]" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Customers ({customerCount})
                </Link>
              </div>
            </div>
            
            {/* Desktop View - Hidden on mobile */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-850 shadow-sm">
              <table className="min-w-full divide-y divide-slate-850/50">
                <thead className="bg-slate-950/40">
                  <tr className="select-none">
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">User Details</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Assigned Role</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white/0 divide-y divide-slate-850/40 text-sm">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center text-slate-500 font-semibold">
                        <Users className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                        No members found matching filter.
                      </td>
                    </tr>
                  ) : filteredStaff.map((s: any) => {
                    const roleName = s.roles?.name;
                    
                    // Curated role avatar gradients
                    const avatarGradient = 
                      roleName === 'SUPER_ADMIN' ? 'from-purple-500 to-indigo-500 shadow-indigo-500/20' :
                      roleName === 'ADMIN' ? 'from-indigo-500 to-blue-500 shadow-blue-500/20' :
                      roleName === 'MANAGER' ? 'from-blue-500 to-cyan-500 shadow-cyan-500/20' :
                      roleName === 'KITCHEN' ? 'from-amber-500 to-orange-500 shadow-orange-500/20' :
                      roleName === 'DELIVERY' ? 'from-emerald-500 to-teal-500 shadow-teal-500/20' :
                      'from-slate-400 to-slate-500 shadow-slate-500/10';

                    // Curated badges with custom layouts
                    const badgeStyles =
                      roleName === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15' :
                      roleName === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15' :
                      roleName === 'MANAGER' ? 'bg-blue-500/10 text-blue-400 border-blue-500/15' :
                      roleName === 'KITCHEN' ? 'bg-amber-500/10 text-amber-455 border-amber-500/15' :
                      roleName === 'DELIVERY' ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/15' :
                      'bg-slate-950/40 text-slate-400 border-slate-850';

                    // Role icons
                    const RoleIcon = 
                      roleName === 'SUPER_ADMIN' ? Crown :
                      roleName === 'ADMIN' ? Shield :
                      roleName === 'MANAGER' ? Shield :
                      roleName === 'KITCHEN' ? ChefHat :
                      roleName === 'DELIVERY' ? Bike :
                      User;

                    return (
                      <tr key={s.user_id} className="hover:bg-slate-900/10 transition-all duration-300 group">
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="flex items-center space-x-3.5">
                            <div className={cn(
                              "w-10 h-10 rounded-full bg-gradient-to-br text-white flex items-center justify-center font-black text-sm uppercase shadow-md select-none",
                              avatarGradient
                            )}>
                              {s.profiles?.full_name ? s.profiles.full_name.charAt(0) : '?'}
                            </div>
                            <div>
                              <div className="text-sm font-extrabold text-white">{s.profiles?.full_name || 'No Name'}</div>
                              <div className="text-xs font-semibold text-slate-400/90 mt-0.5">{s.profiles?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 text-xs font-black rounded-full border gap-1.5 shadow-sm uppercase tracking-wider",
                            badgeStyles
                          )}>
                            <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                            {roleName}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 whitespace-nowrap text-right text-sm font-medium">
                          {roleName !== 'SUPER_ADMIN' ? (
                            <form action={async () => { 'use server'; await revokeRole(s.user_id); }}>
                              <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-455 hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 font-extrabold text-xs">
                                <ShieldOff className="w-3.5 h-3.5 mr-1.5" /> Revoke
                              </Button>
                            </form>
                          ) : (
                            <span className="text-xs font-extrabold text-slate-505 px-4 uppercase tracking-widest">System</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Hidden on desktop */}
            <div className="md:hidden divide-y divide-slate-850/50 border border-slate-850 rounded-2xl overflow-hidden bg-slate-900/10">
              {filteredStaff.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-semibold">
                  <Users className="w-10 h-10 mx-auto text-slate-700 mb-3" />
                  No members found matching filter.
                </div>
              ) : (
                filteredStaff.map((s: any) => {
                  const roleName = s.roles?.name;
                  
                  // Curated role avatar gradients
                  const avatarGradient = 
                    roleName === 'SUPER_ADMIN' ? 'from-purple-500 to-indigo-500 shadow-indigo-500/20' :
                    roleName === 'ADMIN' ? 'from-indigo-500 to-blue-500 shadow-blue-500/20' :
                    roleName === 'MANAGER' ? 'from-blue-500 to-cyan-500 shadow-cyan-500/20' :
                    roleName === 'KITCHEN' ? 'from-amber-500 to-orange-500 shadow-orange-500/20' :
                    roleName === 'DELIVERY' ? 'from-emerald-500 to-teal-500 shadow-teal-500/20' :
                    'from-slate-400 to-slate-500 shadow-slate-500/10';

                  // Curated badges with custom layouts
                  const badgeStyles =
                    roleName === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15' :
                    roleName === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15' :
                    roleName === 'MANAGER' ? 'bg-blue-500/10 text-blue-400 border-blue-500/15' :
                    roleName === 'KITCHEN' ? 'bg-amber-500/10 text-amber-455 border-amber-500/15' :
                    roleName === 'DELIVERY' ? 'bg-emerald-500/10 text-emerald-455 border-emerald-500/15' :
                    'bg-slate-950/40 text-slate-400 border-slate-850';

                  // Role icons
                  const RoleIcon = 
                    roleName === 'SUPER_ADMIN' ? Crown :
                    roleName === 'ADMIN' ? Shield :
                    roleName === 'MANAGER' ? Shield :
                    roleName === 'KITCHEN' ? ChefHat :
                    roleName === 'DELIVERY' ? Bike :
                    User;

                  return (
                    <div key={s.user_id} className="p-4.5 flex flex-col gap-3.5 hover:bg-slate-900/10 transition-colors duration-300">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className={cn(
                          "w-11 h-11 rounded-full bg-gradient-to-br text-white flex items-center justify-center font-black text-sm uppercase shadow-md shrink-0 select-none",
                          avatarGradient
                        )}>
                          {s.profiles?.full_name ? s.profiles.full_name.charAt(0) : '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold text-white truncate">{s.profiles?.full_name || 'No Name'}</div>
                          <div className="text-xs font-semibold text-slate-400/90 mt-0.5 truncate break-all" title={s.profiles?.email}>{s.profiles?.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-850/40 pt-3 mt-1">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 text-[10px] font-black rounded-full border gap-1.5 shadow-sm uppercase tracking-wider",
                          badgeStyles
                        )}>
                          <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                          {roleName}
                        </span>
                        
                        {roleName !== 'SUPER_ADMIN' ? (
                          <form action={async () => { 'use server'; await revokeRole(s.user_id); }}>
                            <Button type="submit" variant="outline" size="sm" className="text-rose-500 border-slate-800 hover:bg-slate-900 font-extrabold text-xs rounded-xl h-8">
                              <ShieldOff className="w-3.5 h-3.5 mr-1" /> Revoke
                            </Button>
                          </form>
                        ) : (
                          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">System</span>
                        )}
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
