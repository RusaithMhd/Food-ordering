'use client';

import { useState } from 'react';
import { createAdminOrder } from '@/actions/admin/orders';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  X,
  UtensilsCrossed
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  base_price: number;
  image_url?: string | null;
  description?: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
}

interface AdminCreateOrderDialogProps {
  menuItems: MenuItem[];
  profiles: Profile[];
}

export function AdminCreateOrderDialog({ menuItems, profiles }: AdminCreateOrderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('GUEST');
  
  // Custom customer details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  
  // Order items state (holds unique item + selected price variant combinations)
  const [orderItems, setOrderItems] = useState<{ menu_item_id: string; quantity: number; unit_price: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to parse price options
  const parsePriceOptions = (desc: string | null | undefined): number[] => {
    if (!desc) return [];
    const parts = desc.split('||prices:');
    if (parts.length < 2) return [];
    const pricePart = parts[1].split('||')[0];
    return pricePart.split(',').map(Number).filter(n => !isNaN(n));
  };

  // Filter menu items by search query
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add menu item to order
  const handleAddItem = (itemId: string, customPrice?: number) => {
    const item = menuItems.find(x => x.id === itemId);
    if (!item) return;

    const finalPrice = customPrice !== undefined ? customPrice : item.base_price;

    setOrderItems(prev => {
      const existing = prev.find(i => i.menu_item_id === itemId && i.unit_price === finalPrice);
      if (existing) {
        return prev.map(i => (i.menu_item_id === itemId && i.unit_price === finalPrice) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menu_item_id: itemId, quantity: 1, unit_price: finalPrice }];
    });
  };

  // Adjust item quantity
  const handleAdjustQuantity = (itemId: string, price: number, amount: number) => {
    setOrderItems(prev => prev.map(i => {
      if (i.menu_item_id === itemId && i.unit_price === price) {
        const newQty = i.quantity + amount;
        return newQty > 0 ? { ...i, quantity: newQty } : null;
      }
      return i;
    }).filter(Boolean) as { menu_item_id: string; quantity: number; unit_price: number }[]);
  };

  // Remove item
  const handleRemoveItem = (itemId: string, price: number) => {
    setOrderItems(prev => prev.filter(i => !(i.menu_item_id === itemId && i.unit_price === price)));
  };

  // Handle profile selection
  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    if (profileId === 'GUEST') {
      setName('');
      setPhone('');
    } else {
      const p = profiles.find(x => x.id === profileId);
      if (p) {
        setName(p.full_name || '');
        setPhone(p.phone_number || '');
      }
    }
  };

  // Calculate subtotal
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + (item.unit_price * item.quantity);
  }, 0);
  
  const deliveryFee = 2.50;
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !location) {
      setError('Please fill in Name, Phone, and Location.');
      return;
    }
    if (orderItems.length === 0) {
      setError('Please add at least one menu item.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createAdminOrder({
        customer_id: selectedProfileId === 'GUEST' ? null : selectedProfileId,
        recipient_name: name,
        phone,
        location,
        customer_note: note,
        items: orderItems.map(i => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
      });

      if (result.success) {
        // Reset state
        setName('');
        setPhone('');
        setLocation('');
        setNote('');
        setOrderItems([]);
        setSelectedProfileId('GUEST');
        setIsOpen(false);
      } else {
        setError(result.error || 'Failed to place order.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center px-5"
      >
        <Plus className="w-4 h-4 mr-2" /> Create New Order
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
            
            {/* Left side: Customer info & Cart summary */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 md:p-8 flex flex-col justify-between overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 max-h-[45vh] md:max-h-none">
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-extrabold text-slate-950">Place Custom Order</h2>
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors md:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-xl">
                    {error}
                  </div>
                )}

                {/* Profile selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Registered Customer (Optional)</label>
                  <select 
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                  >
                    <option value="GUEST">Guest / Phone Order (Unregistered)</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name || 'Unnamed'} ({p.phone_number || 'No phone'})</option>
                    ))}
                  </select>
                </div>

                {/* Delivery address snapshot fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Recipient Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="e.g. +94..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Delivery Location (Hostel/Room/etc)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="e.g. Akbar Hall, Room 42"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Order Note (Optional)</label>
                  <textarea 
                    placeholder="e.g. Deliver before 8 PM, extra spicy"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium min-h-[60px] max-h-[100px]"
                  />
                </div>

                {/* Selected items review */}
                <div className="border-t border-slate-100 pt-4">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-2">Order Items</span>
                  {orderItems.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium italic">No items added yet. Click items on the right side to add.</p>
                  ) : (
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                      {orderItems.map(item => {
                        const m = menuItems.find(x => x.id === item.menu_item_id);
                        if (!m) return null;
                        return (
                          <div key={`${item.menu_item_id}-${item.unit_price}`} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                              {m.image_url ? (
                                <img 
                                  src={m.image_url} 
                                  alt={m.name} 
                                  className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold shrink-0">
                                  <UtensilsCrossed className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-xs text-slate-800 block truncate">{m.name}</span>
                                <span className="text-[10px] text-indigo-600 block font-extrabold">LKR {item.unit_price.toFixed(2)} each</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                <button 
                                  type="button" 
                                  onClick={() => handleAdjustQuantity(item.menu_item_id, item.unit_price, -1)}
                                  className="p-1 hover:bg-slate-50 rounded text-slate-500"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2.5 font-bold text-xs text-slate-800">{item.quantity}</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleAdjustQuantity(item.menu_item_id, item.unit_price, 1)}
                                  className="p-1 hover:bg-slate-50 rounded text-slate-500"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveItem(item.menu_item_id, item.unit_price)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Price calculations & submit */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-4 bg-white">
                <div className="space-y-1.5 text-xs font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-800">LKR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="text-slate-800">LKR {deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-dashed border-slate-100">
                    <span>Total</span>
                    <span className="text-indigo-600">LKR {total.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || orderItems.length === 0}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </form>

            {/* Right side: Search & Menu selection */}
            <div className="w-full md:w-[420px] bg-slate-50 p-6 md:p-8 flex flex-col justify-between max-h-[45vh] md:max-h-none">
              <div className="flex flex-col h-full space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-800 flex items-center">
                    <UtensilsCrossed className="w-4 h-4 mr-2 text-indigo-600" />
                    Select Menu Items
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setIsOpen(false)}
                    className="hidden md:block p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Menu Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                  />
                </div>

                {/* Menu items listing */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[220px] md:max-h-[500px]">
                  {filteredMenuItems.map(item => {
                    const priceOptions = parsePriceOptions(item.description);
                    return (
                      <div
                        key={item.id}
                        className="w-full p-3.5 bg-white rounded-2xl border border-slate-100 flex flex-col shadow-sm group gap-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="w-12 h-12 object-cover rounded-xl border border-slate-100 group-hover:scale-105 transition-transform duration-300 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold shrink-0">
                                <UtensilsCrossed className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-xs text-slate-800 block truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Base: LKR {item.base_price.toFixed(2)}</span>
                            </div>
                          </div>

                          {priceOptions.length === 0 && (
                            <button
                              type="button"
                              onClick={() => handleAddItem(item.id)}
                              className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 transition-all flex items-center justify-center shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Custom Price Pills Selection */}
                        {priceOptions.length > 0 && (
                          <div className="border-t border-slate-50 pt-2.5 mt-0.5">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5">Select Price Option:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {priceOptions.map(price => (
                                <button
                                  key={price}
                                  type="button"
                                  onClick={() => handleAddItem(item.id, price)}
                                  className="px-2.5 py-1 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[10px] font-extrabold rounded-xl border border-indigo-100/50 hover:border-indigo-600 transition-all"
                                >
                                  LKR {price.toFixed(0)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredMenuItems.length === 0 && (
                    <p className="text-xs text-slate-400 font-semibold italic text-center py-6">No matching menu items found.</p>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
