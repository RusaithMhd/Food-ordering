'use client';

import { useBranch } from '@/features/branch/BranchContext';
import { useCart } from '@/features/cart/CartContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { MenuItem, Category } from '@/types/menu';
import { Branch } from '@/services/hotel.service';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, MapPin, Truck, UtensilsCrossed, Sparkles, Coffee, Moon, Clock, Flame, Star, ShieldCheck, ChevronRight } from 'lucide-react';
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
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
        // If a meal type was selected, filter categories that might match it.
        // E.g., if they selected "Breakfast", only show categories with "Breakfast" in the name.
        // If no categories match (e.g. they don't have a Breakfast category), just show all categories.
        let filteredCats = cats;
        if (selectedMealType) {
          const matched = cats.filter(c => c.name.toLowerCase().includes(selectedMealType.toLowerCase()));
          if (matched.length > 0) {
            filteredCats = matched;
          }
        }
        
        setCategories(filteredCats);
        setActiveCategory(filteredCats[0].id);
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
  }, [branchId, selectedMealType]);

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
  if (!selectedMealType) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50">
        
        {/* Animated Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-amber-200/40 to-orange-200/40 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Header / Quote Section */}
        <div className="w-full max-w-5xl mx-auto pt-16 pb-8 px-6 relative z-10 text-center flex flex-col items-center">
          
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full text-slate-700 font-semibold text-sm shadow-sm border border-slate-200 mb-6 animate-in slide-in-from-top-4 fade-in duration-700">
            <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Guest'}!
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6 animate-in zoom-in fade-in duration-700 delay-100">
            What are you craving <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500">
              right now?
            </span>
          </h1>
          
          {/* Daily Quote Card */}
          <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-lg max-w-2xl mx-auto animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-rose-400" />
            <p className="text-lg md:text-xl font-medium text-slate-700 italic relative z-10">
              "{import('@/utils/quotes').then(m => m.getDailyQuote()).catch(() => "Good food is the foundation of genuine happiness.")}"
            </p>
          </div>
        </div>

        {/* Meal Selection Cards */}
        <div className="flex-1 w-full max-w-6xl mx-auto px-6 pb-20 relative z-10 flex flex-col justify-center">
          
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Breakfast Card */}
              <button
                onClick={() => {
                  setSelectedMealType('Breakfast');
                  if (availableBranches.length > 0) {
                    setContext(availableBranches[0].id);
                  }
                }}
                className="group relative h-48 md:h-64 bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl border border-amber-100/50 hover:border-amber-300 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden text-left outline-none focus:ring-4 focus:ring-amber-500/20"
              >
                <div className="absolute right-[-20%] top-[-20%] w-48 h-48 bg-amber-200/50 rounded-full blur-3xl group-hover:bg-amber-300/60 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                      <Coffee className="w-7 h-7 text-amber-500" />
                    </div>
                    <div className="flex items-center bg-amber-100/50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" /> 7am - 11am
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-1 group-hover:text-amber-700 transition-colors">Breakfast</h2>
                    <p className="text-amber-700/70 font-medium mb-3">Fresh pastries & hot coffee</p>
                    <div className="flex items-center text-amber-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                      Explore Menu <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Lunch Card */}
              <button
                onClick={() => {
                  setSelectedMealType('Lunch');
                  if (availableBranches.length > 0) {
                    setContext(availableBranches[0].id);
                  }
                }}
                className="group relative h-48 md:h-64 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl border border-emerald-100/50 hover:border-emerald-300 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden text-left outline-none focus:ring-4 focus:ring-emerald-500/20"
              >
                <div className="absolute right-[-20%] top-[-20%] w-48 h-48 bg-emerald-200/50 rounded-full blur-3xl group-hover:bg-emerald-300/60 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                      <UtensilsCrossed className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div className="flex items-center bg-emerald-100/50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" /> 11am - 4pm
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">Lunch</h2>
                    <p className="text-emerald-700/70 font-medium mb-3">Hearty midday meals</p>
                    <div className="flex items-center text-emerald-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                      Explore Menu <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </button>

              {/* Dinner Card */}
              <button
                onClick={() => {
                  setSelectedMealType('Dinner');
                  if (availableBranches.length > 0) {
                    setContext(availableBranches[0].id);
                  }
                }}
                className="group relative h-48 md:h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl border border-indigo-100/50 hover:border-indigo-300 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden text-left outline-none focus:ring-4 focus:ring-indigo-500/20"
              >
                <div className="absolute right-[-20%] top-[-20%] w-48 h-48 bg-indigo-200/50 rounded-full blur-3xl group-hover:bg-indigo-300/60 transition-colors duration-500" />
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                      <Moon className="w-7 h-7 text-indigo-500" />
                    </div>
                    <div className="flex items-center bg-indigo-100/50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                      <Clock className="w-3 h-3 mr-1" /> 4pm - 11pm
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">Dinner</h2>
                    <p className="text-indigo-700/70 font-medium mb-3">The perfect evening</p>
                    <div className="flex items-center text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                      Explore Menu <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </button>

            </div>
          )}
          
          {availableBranches.length === 0 && !isLoading && (
            <div className="mt-8 p-8 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
              <p className="text-slate-500 font-medium">Our kitchens are currently closed.</p>
            </div>
          )}

          {/* New Sections */}
          <div className="mt-16 w-full animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
            
            {/* Chef's Highlights Placeholder */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-2xl font-black text-slate-900 flex items-center">
                  <Flame className="w-6 h-6 text-orange-500 mr-2" />
                  Popular Right Now
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-lg transition-all group overflow-hidden relative">
                    <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center z-10 text-xs font-bold text-slate-700 shadow-sm">
                      <Star className="w-3 h-3 text-amber-500 mr-1 fill-amber-500" /> 4.9
                    </div>
                    <div className="aspect-square bg-slate-100 rounded-xl mb-3 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-50 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantees Section */}
            <div className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-8 md:p-12 border border-slate-200/60 shadow-xl shadow-slate-200/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 text-amber-600">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Lightning Fast</h4>
                  <p className="text-slate-500 text-sm">Delivery in under 30 minutes, directly to your door.</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 text-rose-600">
                    <Flame className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Always Hot</h4>
                  <p className="text-slate-500 text-sm">Special thermal packaging ensures your food arrives fresh.</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 text-emerald-600">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Premium Quality</h4>
                  <p className="text-slate-500 text-sm">Made with 100% locally sourced, premium ingredients.</p>
                </div>
              </div>
            </div>
            
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
                {selectedMealType ? `${selectedMealType} Menu` : 'Our Menu'}
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
