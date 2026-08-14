import { getDeliveryZones, createZoneAction } from '@/actions/delivery/zones';
import { Button } from '@/components/ui/button';
import { Map, Plus, Edit2, ShieldAlert, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default async function DeliveryZonesPage() {
  const { data: zones, error } = await getDeliveryZones(true);

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center">
            <Map className="w-8 h-8 mr-3 text-indigo-500" />
            Delivery Zones
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">Manage campus locations, hostels, and delivery fees.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center">
          <ShieldAlert className="w-5 h-5 mr-3 shrink-0" />
          <p className="font-medium text-sm">Failed to load zones. Please try again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Add New Zone Form */}
          <div className="xl:col-span-1 h-fit">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500" />
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Map className="w-5 h-5 mr-2 text-indigo-500" />
                Add New Zone
              </h2>
              
              <form action={async (fd) => { 'use server'; await createZoneAction(fd); }} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Zone Name <span className="text-rose-500">*</span></label>
                  <input type="text" name="name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="e.g. North Campus Hostel" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                  <textarea name="description" rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none" placeholder="Detailed location info..."></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Delivery Fee ($) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input type="number" step="0.01" name="delivery_fee" required className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Min. Order ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input type="number" step="0.01" name="minimum_order_value" defaultValue="0.00" className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all mt-2">
                  <Plus className="w-4 h-4 mr-2" /> Add Zone
                </Button>
              </form>
            </div>
          </div>

          {/* Zones List */}
          <div className="xl:col-span-2 space-y-6">
          {/* Mobile Card View (Hidden on sm and up) */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {zones?.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
                <Map className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-medium text-slate-500">No delivery zones found.</p>
              </div>
            ) : (
              zones?.map((zone) => (
                <div key={zone.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 text-lg pr-8">{zone.name}</h3>
                    {zone.active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider absolute top-5 right-5">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wider absolute top-5 right-5">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{zone.description || 'No description provided.'}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Delivery Fee</p>
                      <p className="font-bold text-indigo-600 flex items-center mt-0.5"><DollarSign className="w-3 h-3" />{zone.delivery_fee.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Min. Order</p>
                      <p className="font-semibold text-slate-700 flex items-center mt-0.5"><DollarSign className="w-3 h-3" />{zone.minimum_order.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full text-indigo-600 border-indigo-100 hover:bg-indigo-50 font-bold">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Zone
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (Hidden on extra small screens) */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Zone Name</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Delivery Fee</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Min. Order</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <Map className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="font-medium">No delivery zones found.</p>
                        <p className="text-sm mt-1">Click "Add Zone" to create your first delivery area.</p>
                      </td>
                    </tr>
                  ) : (
                    zones?.map((zone) => (
                      <tr key={zone.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{zone.name}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-slate-600 truncate max-w-[200px]">{zone.description || '-'}</div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="font-bold text-indigo-600">${zone.delivery_fee.toFixed(2)}</div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="font-semibold text-slate-700">${zone.minimum_order.toFixed(2)}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {zone.active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </Button>
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
