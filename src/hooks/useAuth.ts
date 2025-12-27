import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'kaprog' | 'guru_pembimbing';
  jurusan?: string;
  jurusan_id?: string | null;
  guru_pembimbing_id?: string | null;
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
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      const looksLikeEmail = username.includes('@');

      // 1) Try Supabase Auth first (admin email login)
      if (looksLikeEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password,
        });

        if (!error && data.user) {
          const userProfile: AuthUser = {
            id: data.user.id,
            name: data.user.user_metadata?.name || 'Administrator',
            role: 'admin',
            username: data.user.email || username,
          };

          localStorage.setItem('user', JSON.stringify(userProfile));
          setUser(userProfile);
          return true;
        }
      }

      // 2) Fallback to custom auth via Edge Function (kaprog / guru_pembimbing)
      const { data: result, error: fnError } = await supabase.functions.invoke('authenticate', {
        body: { username, password },
      });

      if (fnError || !result?.success) {
        throw new Error(result?.error || 'Username atau password salah');
      }

      if (result.session?.access_token && result.session?.refresh_token) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (setSessionError) {
          console.error('Failed to set session:', setSessionError);
        }
      }

      const userData: AuthUser = result.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Error Login',
        description: error.message || 'Terjadi kesalahan saat login',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('user');
      setUser(null);
      navigate('/');
    }
  }, [navigate]);

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
    isKaprog: user?.role === 'kaprog',
    isGuruPembimbing: user?.role === 'guru_pembimbing',
  };
}
