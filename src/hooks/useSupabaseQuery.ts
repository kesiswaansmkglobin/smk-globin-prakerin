import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  dependencies?: any[];
  enabled?: boolean;
}

export function useSupabaseQuery<T = any>({
  table,
  select = '*',
  filters = {},
  orderBy,
  dependencies = [],
  enabled = true
}: UseSupabaseQueryOptions) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create unique query key based on params
  const queryKey = [table, select, filters, orderBy];

  const fetchData = async () => {
    try {
      let query = (supabase as any).from(table).select(select);

      // Apply filters more efficiently
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw new Error(`Gagal memuat data dari ${table}: ${queryError.message}`);
      }

      return (result as T[]) || [];
    } catch (err: any) {
      const errorMessage = err.message || 'Gagal memuat data';
      
      // Only show toast for user-facing errors
      if (enabled) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      throw err;
    }
  };

  const { data = [], isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: fetchData,
    enabled,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const error = queryError ? (queryError as Error).message : null;

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return { data, loading, error, refetch };
}