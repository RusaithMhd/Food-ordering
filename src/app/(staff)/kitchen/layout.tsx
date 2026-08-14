import { ReactNode } from 'react';
import { getUser } from '@/lib/auth/getUser';
import { redirect } from 'next/navigation';

export default async function KitchenLayout({ children }: { children: ReactNode }) {
  const { role } = await getUser();

  if (!role || (role !== 'KITCHEN' && role !== 'ADMIN' && role !== 'MANAGER' && role !== 'SUPER_ADMIN')) {
    redirect('/login?redirect=/kitchen');
  }

  return <>{children}</>;
}
