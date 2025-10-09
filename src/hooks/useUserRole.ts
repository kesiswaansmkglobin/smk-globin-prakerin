import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  role: string;
  jurusan?: string;
}

/**
 * Hook to fetch and manage user roles from the secure user_roles table
 * This prevents privilege escalation attacks by separating role data
 */
export function useUserRole(userId: string | undefined) {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('user_roles')
          .select('role, jurusan')
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        setUserRole(data);
      } catch (err: any) {
        console.error('Error fetching user role:', err);
        setError(err.message);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Subscribe to role changes
    const subscription = supabase
      .channel(`user_role_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setUserRole(null);
          } else {
            setUserRole(payload.new as UserRole);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { userRole, loading, error };
}
