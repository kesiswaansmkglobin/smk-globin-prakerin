import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'kaprog';
  jurusan?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadUser = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user'); // Clear corrupted data
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Try Supabase authentication first for admin users
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        // If Supabase auth fails, check for Kaprog accounts using secure authentication
        const { data: users, error: dbError } = await supabase
          .rpc('authenticate_user', {
            input_username: username,
            input_password: password
          });

        if (dbError || !users || users.length === 0) {
          throw new Error('Username atau password salah');
        }

        // Store Kaprog user data
        const userData: AuthUser = {
          ...users[0],
          role: users[0].role as 'admin' | 'kaprog'
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }

      // Handle successful Supabase auth (admin user)
      if (data.user) {
        const userProfile = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || 'Administrator',
          role: 'admin' as const,
          username: data.user.email,
        };
        
        localStorage.setItem('user', JSON.stringify(userProfile));
        setUser(userProfile);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error Login",
        description: error.message || 'Terjadi kesalahan saat login',
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      // Sign out from Supabase if admin
      if (user?.role === 'admin') {
        await supabase.auth.signOut();
      }
      
      // Clear local storage
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if Supabase signout fails
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    }
  }, [user, navigate]);

  const checkAuth = useCallback(() => {
    if (!user) {
      navigate('/');
      return false;
    }
    return true;
  }, [user, navigate]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAdmin: user?.role === 'admin',
    isKaprog: user?.role === 'kaprog'
  };
}