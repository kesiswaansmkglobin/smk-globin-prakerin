import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'bimbingan' | 'nilai_prakerin' | 'pengumpulan_laporan' | 'peserta_sidang' | 'prakerin' | 'siswa' | 'kelas' | 'jurusan' | 'guru_pembimbing';

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  showToast?: boolean;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  table,
  onInsert,
  onUpdate,
  onDelete,
  showToast = true,
  enabled = true
}: UseRealtimeSubscriptionOptions) {
  const { toast } = useToast();

  const handleChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const eventType = payload.eventType;
    
    if (showToast) {
      const messages: Record<string, string> = {
        INSERT: `Data ${table} baru ditambahkan`,
        UPDATE: `Data ${table} diperbarui`,
        DELETE: `Data ${table} dihapus`
      };
      
      toast({
        title: "Update Realtime",
        description: messages[eventType] || 'Data berubah'
      });
    }

    switch (eventType) {
      case 'INSERT':
        onInsert?.(payload.new);
        break;
      case 'UPDATE':
        onUpdate?.(payload.new);
        break;
      case 'DELETE':
        onDelete?.(payload.old);
        break;
    }
  }, [table, onInsert, onUpdate, onDelete, showToast, toast]);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        handleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, handleChange, enabled]);
}

// Hook for subscribing to multiple tables
export function useMultiTableRealtime(
  tables: TableName[],
  onDataChange: () => void,
  enabled = true
) {
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled) return;

    const channels = tables.map(table => {
      return supabase
        .channel(`realtime-multi-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table
          },
          () => {
            toast({
              title: "Data Diperbarui",
              description: "Ada perubahan data terbaru"
            });
            onDataChange();
          }
        )
        .subscribe();
    });

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [tables, onDataChange, enabled, toast]);
}
