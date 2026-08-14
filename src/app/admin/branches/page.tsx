import { createAdminClient } from '@/lib/supabase/server';
import { createBranch, createRoom } from '@/actions/admin/branches';
import { Button } from '@/components/ui/button';
import { revalidatePath } from 'next/cache';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Branch &amp; Room Management</h1>
        <p className="text-gray-500 mt-1">Manage your hotel locations and generate room QR codes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Branches Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Add New Branch</h2>
            <form action={async (fd) => { 'use server'; await createBranch(fd); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel</label>
                <select name="hotel_id" required className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm bg-white">
                  <option value="">Select Hotel</option>
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <input type="text" name="name" required placeholder="e.g. Downtown Plaza" className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm" />
              </div>
              <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">Add Branch</Button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-3">Existing Branches</h2>
            <ul className="divide-y divide-gray-100">
              {branches.map(b => (
                <li key={b.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.hotels?.name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${b.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Add New Room</h2>
            <form action={async (fd) => { 'use server'; await createRoom(fd); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select name="branch_id" required className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm bg-white">
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                  <input type="text" name="room_number" required placeholder="e.g. 101" className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <input type="text" name="floor" placeholder="e.g. 1" className="w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">Add Room</Button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Existing Rooms &amp; QR Links</h2>
              <form action={async () => { 'use server'; revalidatePath('/admin/branches'); }}>
                <Button variant="outline" size="sm">Refresh</Button>
              </form>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.map(r => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium text-sm">{r.room_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{r.branches?.name}</td>
                      <td className="px-4 py-3 text-right">
                        <a 
                          href={`/?branchId=${r.branch_id}&roomId=${r.id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View Menu URL
                        </a>
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
