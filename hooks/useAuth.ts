import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email?: string;
  user_metadata?: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    const cleanup = subscribeToAuthChanges();
    return cleanup;
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser as User | null);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAuthChanges = () => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as User | null);
      setLoading(false);
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.replace('/onboarding');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { user, loading, signOut };
}
