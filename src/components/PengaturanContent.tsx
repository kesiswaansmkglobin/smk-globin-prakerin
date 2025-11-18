import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PengaturanContentProps {
  user: any;
}

const PengaturanContent = ({ user }: PengaturanContentProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const backupDatabase = async () => {
    setLoading(true);
    try {
      // Get all tables data
      const [jurusanRes, usersRes, kelasRes, siswaRes, prakerinRes, sekolahRes] = await Promise.all([
        supabase.from('jurusan').select('*'),
        supabase.from('users').select('*'),
        supabase.from('kelas').select('*'),
        supabase.from('siswa').select('*'),
        supabase.from('prakerin').select('*'),
        supabase.from('sekolah').select('*')
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        tables: {
          jurusan: jurusanRes.data || [],
          users: usersRes.data || [],
          kelas: kelasRes.data || [],
          siswa: siswaRes.data || [],
          prakerin: prakerinRes.data || [],
          sekolah: sekolahRes.data || []
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_sim_prakerin_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Database berhasil dibackup",
      });
    } catch (error) {
      console.error('Error backing up database:', error);
      toast({
        title: "Error",
        description: "Tidak dapat membackup database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('Apakah Anda yakin ingin merestore database? Ini akan mengganti semua data yang ada!')) {
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      if (!backupData.tables) {
        throw new Error('Format file backup tidak valid');
      }

      // Clear existing data first
      await Promise.all([
        supabase.from('prakerin').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('siswa').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('kelas').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('jurusan').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('sekolah').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      // Insert backup data
      if (backupData.tables.sekolah?.length) {
        await supabase.from('sekolah').insert(backupData.tables.sekolah);
      }
      if (backupData.tables.jurusan?.length) {
        await supabase.from('jurusan').insert(backupData.tables.jurusan);
      }
      if (backupData.tables.users?.length) {
        await supabase.from('users').insert(backupData.tables.users);
      }
      if (backupData.tables.kelas?.length) {
        await supabase.from('kelas').insert(backupData.tables.kelas);
      }
      if (backupData.tables.siswa?.length) {
        await supabase.from('siswa').insert(backupData.tables.siswa);
      }
      if (backupData.tables.prakerin?.length) {
        await supabase.from('prakerin').insert(backupData.tables.prakerin);
      }

      toast({
        title: "Berhasil",
        description: "Database berhasil direstore",
      });
    } catch (error) {
      console.error('Error restoring database:', error);
      toast({
        title: "Error",
        description: "Tidak dapat merestore database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const clearDatabase = async () => {
    if (!confirm('PERINGATAN: Ini akan menghapus SEMUA data dalam database! Apakah Anda yakin?')) {
      return;
    }

    if (!confirm('Konfirmasi sekali lagi: Semua data akan hilang permanen!')) {
      return;
    }

    setLoading(true);
    try {
      // Delete all data from all tables
      await Promise.all([
        supabase.from('prakerin').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('siswa').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('kelas').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('jurusan').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('sekolah').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      toast({
        title: "Berhasil",
        description: "Semua data berhasil dihapus",
      });
    } catch (error) {
      console.error('Error clearing database:', error);
      toast({
        title: "Error",
        description: "Tidak dapat menghapus data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola backup, restore, dan pengaturan database</p>
      </div>

      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-amber-600 dark:text-amber-400">
          <strong>Perhatian:</strong> Fitur ini hanya tersedia untuk Administrator. 
          Pastikan Anda memahami konsekuensi dari setiap tindakan sebelum melanjutkan.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backup Database */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <Download className="mr-2 h-5 w-5" />
              Backup Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Unduh semua data database dalam format JSON untuk backup.
            </p>
            <Button 
              onClick={backupDatabase}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Memproses...' : 'Backup Database'}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Database */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-600">
              <Upload className="mr-2 h-5 w-5" />
              Restore Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pulihkan database dari file backup JSON.
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={restoreDatabase}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                {loading ? 'Memproses...' : 'Pilih File Backup'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clear Database */}
        <Card className="card-gradient border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Trash2 className="mr-2 h-5 w-5" />
              Hapus Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Hapus semua data dalam database. Tindakan ini tidak dapat dibatalkan!
            </p>
            <Button 
              onClick={clearDatabase}
              disabled={loading}
              className="w-full"
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {loading ? 'Memproses...' : 'Hapus Semua Data'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Database Info */}
      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Informasi Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">Tabel Database:</p>
              <ul className="mt-2 space-y-1">
                <li>• sekolah - Data sekolah</li>
                <li>• jurusan - Data jurusan</li>
                <li>• kelas - Data kelas</li>
                <li>• siswa - Data siswa</li>
                <li>• prakerin - Data prakerin</li>
                <li>• users - Data pengguna (Kaprog)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Format Backup:</p>
              <ul className="mt-2 space-y-1">
                <li>• Format: JSON</li>
                <li>• Encoding: UTF-8</li>
                <li>• Termasuk: Semua data tabel</li>
                <li>• Timestamp: Ya</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PengaturanContent;