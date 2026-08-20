'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { User } from '@supabase/supabase-js';

// We define a custom compatible User type for the application code
export interface CompatibleUser {
  uid: string;
  email: string | undefined;
  displayName: string;
  avatarUrl?: string;
  emailConfirmed?: boolean;
}

interface AuthContextType {
  user: CompatibleUser | null;
  loading: boolean;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userRole: null });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CompatibleUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 1. Initial Session Fetch
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const compatibleUser: CompatibleUser = {
            uid: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatarUrl: session.user.user_metadata?.avatar_url || '',
            emailConfirmed: !!session.user.email_confirmed_at,
          };
          setUser(compatibleUser);

          // Fetch user role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const roleName = (roleData?.roles as any)?.name || null;
          setUserRole(roleName);
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error('Error fetching initial Supabase session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        const compatibleUser: CompatibleUser = {
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          avatarUrl: session.user.user_metadata?.avatar_url || '',
          emailConfirmed: !!session.user.email_confirmed_at,
        };
        setUser(compatibleUser);

        try {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const roleName = (roleData?.roles as any)?.name || null;
          setUserRole(roleName);
        } catch (e) {
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}
