import { supabase } from '@/integrations/supabase/client';

/**
 * Secure permission checks using the user_roles table
 * This prevents privilege escalation by separating role data
 */

export interface SecureUser {
  id: string;
  role: string;
  jurusan?: string;
}

/**
 * Valid app roles
 */
export type AppRole = 'admin' | 'kaprog' | 'kepala_sekolah';

/**
 * Check if user has a specific role from the secure user_roles table
 */
export const hasRole = async (userId: string, role: AppRole): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      console.error('Error checking role:', error);
      return false;
    }

    return (count ?? 0) > 0;
  } catch {
    return false;
  }
};

/**
 * Get user's role and jurusan from secure table
 */
export const getUserRole = async (userId: string): Promise<SecureUser | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, jurusan')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return {
      id: userId,
      role: data.role,
      jurusan: data.jurusan || undefined
    };
  } catch {
    return null;
  }
};

/**
 * Check if user can edit sekolah data
 */
export const canEditSekolah = async (userId: string): Promise<boolean> => {
  return await hasRole(userId, 'admin');
};

/**
 * Check if user can edit jurusan data
 */
export const canEditJurusan = async (userId: string): Promise<boolean> => {
  return await hasRole(userId, 'admin');
};

/**
 * Check if user can edit kelas data
 */
export const canEditKelas = async (userId: string): Promise<boolean> => {
  return await hasRole(userId, 'admin');
};

/**
 * Check if user can edit siswa data
 */
export const canEditSiswa = async (userId: string): Promise<boolean> => {
  return await hasRole(userId, 'admin');
};

/**
 * Check if user can edit prakerin data
 */
export const canEditPrakerin = async (userId: string): Promise<boolean> => {
  const isAdmin = await hasRole(userId, 'admin');
  const isKaprog = await hasRole(userId, 'kaprog');
  return isAdmin || isKaprog;
};

/**
 * Check if user should see filtered data by jurusan
 */
export const shouldFilterByJurusan = async (userId: string): Promise<boolean> => {
  return await hasRole(userId, 'kaprog');
};
