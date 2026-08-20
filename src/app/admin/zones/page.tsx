import { getDeliveryZones, createZoneAction, updateZoneAction, deleteZoneAction } from '@/actions/delivery/zones';
import { Button } from '@/components/ui/button';
import { Map, Plus, Edit2, ShieldAlert, Trash2, X } from 'lucide-react';
import Link from 'next/link';

export default async function DeliveryZonesPage(props: { searchParams: Promise<{ edit?: string }> }) {
  const searchParams = await props.searchParams;
  const { data: zones, error } = await getDeliveryZones(true);
  
  const editId = searchParams?.edit;
  const editZone = editId ? zones?.find(z => z.id === editId) : null;

  return (
    <div className="space-y-6 pb-24 md:pb-6 select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center">
            <Map className="w-8 h-8 mr-3 text-indigo-400" />
            Delivery Zones
          </h1>
          <p className="text-slate-400 mt-1.5 font-medium">Manage campus locations, hostels, and delivery fees.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/15 text-rose-400 p-4 rounded-xl flex items-center shadow-md shadow-rose-500/5">
          <ShieldAlert className="w-5 h-5 mr-3 shrink-0 text-rose-550 animate-pulse" />
          <p className="font-semibold text-sm">Failed to load zones. Please try again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Add/Edit Zone Form */}
          <div className="xl:col-span-1 h-fit">
            <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800/80 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />
              <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                <span className="flex items-center">
                  {editZone ? <Edit2 className="w-5 h-5 mr-2.5 text-indigo-400 animate-pulse" /> : <Map className="w-5 h-5 mr-2.5 text-indigo-400" />}
                  {editZone ? 'Edit Zone' : 'Add New Zone'}
                </span>
                {editZone && (
                  <Link href="/admin/zones">
                    <Button variant="ghost" size="sm" className="text-slate-550 hover:text-slate-300">
                      <X className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </h2>
              
              <form action={async (fd) => { 'use server'; if (editZone) { await updateZoneAction(fd); } else { await createZoneAction(fd); } }} className="space-y-5">
                {editZone && <input type="hidden" name="id" value={editZone.id} />}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Zone Name <span className="text-rose-500">*</span></label>
                  <input type="text" name="name" defaultValue={editZone?.name || ''} required className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300" placeholder="e.g. North Campus Hostel" />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                  <textarea name="description" defaultValue={editZone?.description || ''} rows={2} className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none duration-300" placeholder="Detailed location info..."></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Delivery Fee (LKR) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">LKR</span>
                      <input type="number" step="0.01" name="delivery_fee" defaultValue={editZone?.delivery_fee || ''} required className="w-full pl-13 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white placeholder-slate-555 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Min. Order (LKR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">LKR</span>
                      <input type="number" step="0.01" name="minimum_order_value" defaultValue={editZone?.minimum_order || '0.00'} className="w-full pl-13 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300" />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 border border-slate-855 shadow-md active:scale-[0.98] transition-all mt-2">
                  {editZone ? (
                    <><Edit2 className="w-4 h-4 mr-2" /> Save Changes</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Add Zone</>
                  )}
                </Button>
                {editZone && (
                  <Link href="/admin/zones">
                    <Button type="button" variant="outline" className="w-full mt-2 h-12 rounded-xl text-sm font-bold bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-800 hover:text-white">
                      Cancel
                    </Button>
                  </Link>
                )}
              </form>
            </div>
          </div>

          {/* Zones List */}
          <div className="xl:col-span-2 space-y-6">
            {/* Mobile Card View (Hidden on sm and up) */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {zones?.length === 0 ? (
                <div className="bg-slate-900/50 rounded-2xl border border-slate-850 p-8 text-center shadow-md">
                  <Map className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                  <p className="font-semibold text-slate-500">No delivery zones found.</p>
                </div>
              ) : (
                zones?.map((zone) => (
                  <div key={zone.id} className={`bg-slate-900/40 rounded-2xl p-5 border shadow-sm relative ${editZone?.id === zone.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-850'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white text-lg pr-8">{zone.name}</h3>
                      {zone.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-450 border border-emerald-500/15 uppercase tracking-wider absolute top-5 right-5">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-950/45 text-slate-500 border border-slate-850 uppercase tracking-wider absolute top-5 right-5">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-4">{zone.description || 'No description provided.'}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                      <div>
                        <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Delivery Fee</p>
                        <p className="font-black text-indigo-400 flex items-center mt-0.5 text-sm">LKR {zone.delivery_fee.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">Min. Order</p>
                        <p className="font-semibold text-slate-300 flex items-center mt-0.5 text-sm">LKR {zone.minimum_order.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/admin/zones?edit=${zone.id}`} className="flex-1">
                        <Button variant="outline" className="w-full text-indigo-400 border-slate-800 hover:bg-slate-900 font-bold h-9 text-xs rounded-xl">
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                        </Button>
                      </Link>
                      <form action={async () => { 'use server'; await deleteZoneAction(zone.id); }} className="flex-[0.5]">
                        <Button variant="outline" className="w-full text-rose-500 border-slate-800 hover:bg-slate-900 font-bold h-9 rounded-xl">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (Hidden on extra small screens) */}
            <div className="hidden sm:block bg-slate-900/50 backdrop-blur-md rounded-[2rem] border border-slate-800/80 overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-950/40 border-b border-slate-850 text-slate-400 text-xs font-black uppercase tracking-widest">
                      <th className="py-4 px-6 font-bold">Zone Name</th>
                      <th className="py-4 px-6 font-bold">Description</th>
                      <th className="py-4 px-6 font-bold text-right">Delivery Fee</th>
                      <th className="py-4 px-6 font-bold text-right">Min. Order</th>
                      <th className="py-4 px-6 font-bold text-center">Status</th>
                      <th className="py-4 px-6 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50 text-sm">
                    {zones?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-slate-500">
                          <Map className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                          <p className="font-semibold text-slate-400">No delivery zones found.</p>
                          <p className="text-xs text-slate-500 mt-1">Click "Add Zone" to create your first delivery area.</p>
                        </td>
                      </tr>
                    ) : (
                      zones?.map((zone) => (
                        <tr key={zone.id} className={`hover:bg-slate-900/10 transition-all duration-300 group ${editZone?.id === zone.id ? 'bg-indigo-500/5' : ''}`}>
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-white">{zone.name}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm text-slate-400 truncate max-w-[200px]" title={zone.description || ''}>{zone.description || '-'}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="font-black text-indigo-400">LKR {zone.delivery_fee.toFixed(2)}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="font-semibold text-slate-300">LKR {zone.minimum_order.toFixed(2)}</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {zone.is_active ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-450 border border-emerald-500/15">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-950/45 text-slate-500 border border-slate-850">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
                              <Link href={`/admin/zones?edit=${zone.id}`}>
                                <Button variant="ghost" size="sm" className="text-indigo-450 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </Link>
                              <form action={async () => { 'use server'; await deleteZoneAction(zone.id); }}>
                                <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-455 hover:bg-rose-500/10 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
