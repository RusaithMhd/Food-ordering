import { createAdminClient } from '@/lib/supabase/server';
import { createBranch, createRoom } from '@/actions/admin/branches';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';
import { Store, DoorClosed, MapPin, Link2, Plus, RefreshCw } from 'lucide-react';

async function getBranchData() {
  const supabase = await createAdminClient();
  
  const { data: hotels } = await supabase.from('hotels').select('id, name');
  const { data: branches } = await supabase.from('branches').select('*, hotels(name)').order('name');
  const { data: rooms } = await supabase.from('rooms').select('*, branches(name)').order('room_number');

  return { 
    hotels: hotels || [], 
    branches: branches || [], 
    rooms: rooms || [] 
  };
}

export default async function BranchManagementPage() {
  const { hotels, branches, rooms } = await getBranchData();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Kitchens &amp; Rooms</h1>
        <p className="text-slate-500 mt-1.5 font-medium">Manage your delivery kitchens and generate room QR codes.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Branches Section */}
        <div className="space-y-6">
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <Store className="w-5 h-5 mr-2 text-emerald-500" />
              Add New Kitchen
            </h2>
            <form action={async (fd) => { 'use server'; await createBranch(fd); }} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hotel / Organization</label>
                <select name="hotel_id" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer">
                  <option value="">Select Organization</option>
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kitchen Name</label>
                <input type="text" name="name" required placeholder="e.g. Downtown Plaza Kitchen" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all">
                <Plus className="w-4 h-4 mr-2" /> Create Kitchen
              </Button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-slate-400" />
              Active Kitchens
            </h2>
            <ul className="space-y-3">
              {branches.map(b => (
                <li key={b.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <Store className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <p className="text-xs font-medium text-slate-500">{b.hotels?.name}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${b.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                    {b.status}
                  </span>
                </li>
              ))}
              {branches.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm font-medium">No kitchens found.</div>
              )}
            </ul>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <DoorClosed className="w-5 h-5 mr-2 text-indigo-500" />
              Add QR Room/Table
            </h2>
            <form action={async (fd) => { 'use server'; await createRoom(fd); }} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned Kitchen</label>
                <select name="branch_id" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                  <option value="">Select Kitchen</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Room / Table ID</label>
                  <input type="text" name="room_number" required placeholder="e.g. 101 or Table 5" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Floor / Area</label>
                  <input type="text" name="floor" placeholder="e.g. Poolside" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all">
                <Plus className="w-4 h-4 mr-2" /> Add Location
              </Button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <Link2 className="w-5 h-5 mr-2 text-slate-400" />
                QR Code Links
              </h2>
              <form action={async () => { 'use server'; revalidatePath('/admin/branches'); }}>
                <Button variant="outline" size="sm" className="rounded-full font-medium border-slate-200 hover:bg-slate-50">
                  <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
                </Button>
              </form>
            </div>
            
            <div className="overflow-y-auto max-h-96 rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kitchen</th>
                    <th className="px-5 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">QR Link</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {rooms.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-sm text-slate-900">{r.room_number}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-500">{r.branches?.name}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <a 
                          href={`/?branchId=${r.branch_id}&roomId=${r.id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold text-xs bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5 mr-1" /> Copy URL
                        </a>
                      </td>
                    </tr>
                  ))}
                  {rooms.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm font-medium text-slate-400">
                        No rooms or tables configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
