import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseSupabaseMutationOptions {
  table: string;
  onSuccess?: (data?: any) => void;
  onError?: (error: string) => void;
}

export function useSupabaseMutation({ 
  table, 
  onSuccess, 
  onError 
}: UseSupabaseMutationOptions) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const insert = async (data: any) => {
    try {
      setLoading(true);
      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert([data])
        .select();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data berhasil ditambahkan"
      });

      onSuccess?.(result);
      return { data: result, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Terjadi kesalahan';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      onError?.(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: any) => {
    try {
      setLoading(true);
      const { data: result, error } = await (supabase as any)
        .from(table)
        .update(data)
        .eq('id', id)
        .select();

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data berhasil diperbarui"
      });

      onSuccess?.(result);
      return { data: result, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Terjadi kesalahan';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      onError?.(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data berhasil dihapus"
      });

      onSuccess?.();
      return { error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal menghapus data';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      onError?.(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    insert,
    update,
    remove,
    loading
  };
}