'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { verifySession } from '@/actions/auth/verify-session';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userRole: null });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Sync session with the server and map to Supabase
        const token = await firebaseUser.getIdToken();
        const res = await verifySession(token);
        if (res.success && res.role) {
          setUserRole(res.role);
        } else {
          setUserRole(null);
        }
      } else {
        // Clear session
        await verifySession(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}
