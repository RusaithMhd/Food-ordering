'use client';

import { useBranch } from '@/features/branch/BranchContext';
import { useCart } from '@/features/cart/CartContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { MenuItem, Category } from '@/types/menu';
import { Branch } from '@/services/hotel.service';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, MapPin, Truck, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import Link from 'next/link';

export default function CustomerMenu() {
  const { branchId, branch, isLoading: isContextLoading, setContext } = useBranch();
  const { addItem, totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Fetch branches if no branch is selected (Landing Page mode)
  useEffect(() => {
    if (!branchId) {
      const fetchBranches = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const { data } = await supabase.from('branches').select('*').eq('status', 'OPEN');
        if (data) setAvailableBranches(data);
        setIsLoading(false);
      };
      fetchBranches();
      return;
    }

    // Fetch Menu if branch is selected (Menu mode)
    const fetchMenu = async () => {
      setIsLoading(true);
      const supabase = createClient();
      
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

  if (isContextLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Truck className="h-8 w-8 text-slate-300 mb-4" />
          <p className="text-slate-400 font-medium tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LANDING PAGE (No Branch Selected)
  // -------------------------------------------------------------
  if (!branchId) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-white">
        {/* Header removed in favor of global Navbar */}

        {/* Hero Section */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 relative pt-20 pb-12 text-center">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-amber-100/50 to-orange-100/50 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-emerald-100/40 to-teal-100/40 blur-3xl" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center px-4 py-2 bg-amber-50 rounded-full text-amber-600 font-semibold text-sm shadow-sm border border-amber-100 mb-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Premium Food Delivery
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Cravings satisfied,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                straight to your door.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto font-medium">
              Select your location below to explore our curated menu of delicious meals.
            </p>
          </div>
        </div>

        {/* Branch Selection Section */}
        <div className="bg-[#F8F9FA] flex-1 w-full border-t border-slate-100 py-16 px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
              <MapPin className="mr-2 h-6 w-6 text-slate-400" />
              Available Menus
            </h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableBranches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setContext(b.id)}
                    className="group bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-200/50 border border-slate-200 text-left transition-all duration-300 transform hover:-translate-y-1 focus:ring-4 focus:ring-amber-500/20 outline-none"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-50 transition-colors border border-slate-100">
                      <UtensilsCrossed className="h-6 w-6 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{b.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">Delivery available • 30-45 min</p>
                  </button>
                ))}
                {availableBranches.length === 0 && !isLoading && (
                  <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
                    <p className="text-slate-500 font-medium">No menus are currently available.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MENU PAGE (Branch Selected)
  // -------------------------------------------------------------
  const itemsToDisplay = activeCategory 
    ? menuItems.filter(item => item.category_id === activeCategory)
    : menuItems;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans selection:bg-slate-200 selection:text-slate-900">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="px-5 py-4 flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            {/* Back button removed since there is only one kitchen */}
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-900 leading-none mb-1">
                Our Menu
              </h1>
              <p className="text-sm font-medium text-slate-500 leading-none">Delivering to you</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-95 group"
            >
              <ShoppingCart className="h-5 w-5 text-slate-700 group-hover:text-slate-900 transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[11px] font-bold h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Smooth Scrolling Categories */}
        {categories.length > 0 && (
          <div className="w-full overflow-x-auto hide-scrollbar border-t border-slate-100">
            <div className="flex space-x-2 px-5 py-3 max-w-4xl mx-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                    activeCategory === cat.id 
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 transform scale-[1.02]' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Menu Grid */}
      <main className="p-5 max-w-4xl mx-auto mt-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 flex gap-4 h-36">
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-50 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                </div>
                <div className="w-28 h-28 bg-slate-100 rounded-2xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {itemsToDisplay.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white p-5 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-200/40 border border-slate-100 flex gap-5 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Product Info */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1.5 group-hover:text-amber-600 transition-colors">{item.name}</h3>
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-extrabold text-slate-900 text-lg">${item.base_price.toFixed(2)}</span>
                    <Button 
                      size="sm" 
                      className="rounded-full bg-slate-900 text-white hover:bg-amber-500 hover:text-white px-5 font-semibold transition-all duration-300 shadow-md shadow-slate-900/10 active:scale-95"
                      onClick={() => addItem(item)}
                    >
                      <Plus className="h-4 w-4 mr-1.5" /> Add
                    </Button>
                  </div>
                </div>
                
                {/* Image Placeholder */}
                {item.image_url ? (
                  <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-50 relative shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                    <span className="text-xs font-medium text-slate-400">No Image</span>
                  </div>
                )}
              </div>
            ))}

            {itemsToDisplay.length === 0 && (
              <div className="col-span-full text-center py-20 px-6 bg-white rounded-3xl border border-slate-100 border-dashed">
                <UtensilsCrossed className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900">No items available</h3>
                <p className="text-slate-500 mt-1">Check back later for new additions to the menu.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Elegant Sticky Checkout Bar for Mobile */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)] z-20 md:hidden animate-in slide-in-from-bottom-4 duration-300">
          <Button 
            className="w-full h-14 rounded-2xl text-[17px] font-bold bg-slate-900 hover:bg-slate-800 text-white flex justify-between px-6 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span>{totalItems} items</span>
            </div>
            <span className="flex items-center">
              Checkout <span className="ml-2">→</span>
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
