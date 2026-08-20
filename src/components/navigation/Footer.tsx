'use client';

import { useBranch } from '@/features/branch/BranchContext';
import { usePathname } from 'next/navigation';

export function Footer() {
  const { branch } = useBranch();
  const pathname = usePathname();
  
  // Hide the footer inside admin, kitchen, or delivery dashboards
  if (
    pathname?.startsWith('/admin') || 
    pathname?.startsWith('/kitchen') || 
    pathname?.startsWith('/delivery')
  ) {
    return null;
  }
  
  return (
    <footer className="w-full py-6 text-center border-t border-slate-200/50 mt-auto select-none bg-white/50 backdrop-blur-md">
      <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
        &copy; {new Date().getFullYear()} {branch?.name || 'Atheef Hotel'}. All rights reserved.
      </p>
      <p className="text-[10px] text-slate-400/80 font-bold mt-1 tracking-tight">
        Developed by <a href="https://www.rusaith.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 hover:underline font-extrabold transition-all">Rusaith</a>
      </p>
    </footer>
  );
}
