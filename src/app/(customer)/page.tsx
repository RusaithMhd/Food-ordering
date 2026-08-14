'use client';

import { useBranch } from '@/features/branch/BranchContext';
import { useCart } from '@/features/cart/CartContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { MenuItem, Category } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import Link from 'next/link';

export default function CustomerMenu() {
  const { branchId, branch, room, isLoading: isContextLoading } = useBranch();
  const { addItem, totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) return;

    const fetchMenu = async () => {
      setIsLoading(true);
      const supabase = createClient();
      
      // Fetch Categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
        
      if (cats && cats.length > 0) {
        setCategories(cats);
        setActiveCategory(cats[0].id);
      }

      // Fetch Items
      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_active', true);
        
      if (items) {
        setMenuItems(items);
      }

      setIsLoading(false);
    };

    fetchMenu();
  }, [branchId]);

  if (isContextLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading menu...</div>;
  }

  if (!branchId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          To view the menu and place an order, please scan the QR code located in your room or select your hotel below.
        </p>
        <div className="p-6 bg-gray-50 rounded-xl w-full max-w-md border border-gray-100">
          <p className="text-sm text-gray-500 italic">QR scanning flow will automatically assign your room and branch.</p>
        </div>
      </div>
    );
  }

  const itemsToDisplay = activeCategory 
    ? menuItems.filter(item => item.category_id === activeCategory)
    : menuItems;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
          <div>
            <h1 className="font-bold text-lg text-gray-900">{branch?.name || 'Hotel Menu'}</h1>
            {room && <p className="text-sm text-gray-500">Room {room.room_number}</p>}
          </div>
          <div className="flex items-center space-x-3">
            {!user ? (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm">Sign In</Button>
              </Link>
            ) : (
              <span className="text-sm text-gray-500">Hi, {user.displayName?.split(' ')[0]}</span>
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="relative rounded-full border-gray-200"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Categories Tab Bar */}
        {categories.length > 0 && (
          <div className="overflow-x-auto hide-scrollbar px-4 py-3 bg-white">
            <div className="flex space-x-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Menu Grid */}
      <main className="p-4 max-w-2xl mx-auto">
        <div className="space-y-4">
          {itemsToDisplay.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
              {/* Product Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">{item.name}</h3>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-gray-900">${item.base_price.toFixed(2)}</span>
                  <Button 
                    size="sm" 
                    className="rounded-full bg-black text-white hover:bg-gray-800 px-4"
                    onClick={() => addItem(item)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
              
              {/* Image Placeholder (if any) */}
              {item.image_url ? (
                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {/* Using standard img instead of Next Image for external arbitrary URLs in MVP */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 shrink-0 rounded-xl bg-gray-50 flex items-center justify-center border border-dashed border-gray-200">
                  <span className="text-xs text-gray-400">No Image</span>
                </div>
              )}
            </div>
          ))}

          {itemsToDisplay.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No items found in this category.
            </div>
          )}
        </div>
      </main>

      {/* Sticky Checkout Bar for Mobile */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-20 md:hidden">
          <Button 
            className="w-full h-14 rounded-xl text-lg font-medium bg-black hover:bg-gray-800 text-white flex justify-between px-6"
            onClick={() => setIsCartOpen(true)}
          >
            <span>View Cart ({totalItems})</span>
            <span>Checkout</span>
          </Button>
        </div>
      )}
    </div>
  );
}
