import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  dependencies?: any[];
}

export function useSupabaseQuery<T = any>({
  table,
  select = '*',
  filters = {},
  orderBy,
  dependencies = []
}: UseSupabaseQueryOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = (supabase as any).from(table).select(select);

      // Apply filters more efficiently
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        console.error(`Query error for ${table}:`, queryError);
        throw new Error(`Gagal memuat data dari ${table}: ${queryError.message}`);
      }

      setData(result || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memuat data';
      setError(errorMessage);
      console.error(`useSupabaseQuery error for ${table}:`, err);
      
      // Only show toast for non-trivial errors
      if (!errorMessage.includes('timeout')) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      // Set empty array on error to prevent rendering issues
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [table, select, JSON.stringify(filters), orderBy, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}