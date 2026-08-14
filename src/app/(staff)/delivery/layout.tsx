import { ReactNode } from 'react';
import { getUser } from '@/lib/auth/getUser';
import { redirect } from 'next/navigation';

export default async function DeliveryLayout({ children }: { children: ReactNode }) {
  const { role } = await getUser();

  if (!role || (role !== 'DELIVERY' && role !== 'ADMIN' && role !== 'MANAGER' && role !== 'SUPER_ADMIN')) {
    redirect('/login?redirect=/delivery');
  }

  return <>{children}</>;
}
