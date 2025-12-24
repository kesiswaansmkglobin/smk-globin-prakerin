import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface GuruPembimbingContentProps {
  user: any;
}

interface Jurusan {
  id: string;
  nama: string;
}

interface GuruPembimbing {
  id: string;
  nama: string;
  nip: string | null;
  email: string | null;
  telepon: string | null;
  jurusan_id: string | null;
  jurusan?: { nama: string } | null;
}

const GuruPembimbingContent = ({ user }: GuruPembimbingContentProps) => {
  const [guruList, setGuruList] = useState<GuruPembimbing[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<GuruPembimbing | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    email: '',
    telepon: '',
    jurusan_id: ''
  });
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      let guruQuery = supabase
        .from('guru_pembimbing')
        .select('*, jurusan(nama)')
        .order('nama');

      const jurusanQuery = supabase
        .from('jurusan')
        .select('id, nama')
        .order('nama');

      // Filter by jurusan if kaprog
      if (user?.role === 'kaprog') {
        const { data: jurusanData } = await supabase
          .from('jurusan')
          .select('id')
          .eq('nama', user.jurusan)
          .single();
        
        if (jurusanData) {
          guruQuery = guruQuery.eq('jurusan_id', jurusanData.id);
        }
      }

      const [guruRes, jurusanRes] = await Promise.all([guruQuery, jurusanQuery]);

      if (guruRes.error) throw guruRes.error;
      if (jurusanRes.error) throw jurusanRes.error;

      setGuruList(guruRes.data || []);
      setJurusanList(jurusanRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useRealtimeSubscription({
    table: 'guru_pembimbing',
    onInsert: loadData,
    onUpdate: loadData,
    onDelete: loadData,
    showToast: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        nama: formData.nama,
        nip: formData.nip || null,
        email: formData.email || null,
        telepon: formData.telepon || null,
        jurusan_id: formData.jurusan_id || null
      };

      if (editingGuru) {
        const { error } = await supabase
          .from('guru_pembimbing')
          .update(data)
          .eq('id', editingGuru.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data guru pembimbing berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('guru_pembimbing')
          .insert([data]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data guru pembimbing berhasil ditambahkan"
        });
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (guru: GuruPembimbing) => {
    setEditingGuru(guru);
    setFormData({
      nama: guru.nama,
      nip: guru.nip || '',
      email: guru.email || '',
      telepon: guru.telepon || '',
      jurusan_id: guru.jurusan_id || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data guru pembimbing ini?')) return;

    try {
      const { error } = await supabase
        .from('guru_pembimbing')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data guru pembimbing berhasil dihapus"
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      nip: '',
      email: '',
      telepon: '',
      jurusan_id: ''
    });
    setEditingGuru(null);
  };

  const canEdit = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Guru Pembimbing</h1>
          <p className="text-muted-foreground">Kelola data guru pembimbing prakerin</p>
        </div>

        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glow-effect" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Guru Pembimbing
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-surface border-border/50">
              <DialogHeader>
                <DialogTitle>
                  {editingGuru ? 'Edit Guru Pembimbing' : 'Tambah Guru Pembimbing'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap *</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    placeholder="Nama lengkap guru"
                    className="bg-input/50 border-border/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nip">NIP</Label>
                  <Input
                    id="nip"
                    value={formData.nip}
                    onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                    placeholder="Nomor Induk Pegawai"
                    className="bg-input/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@domain.com"
                    className="bg-input/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telepon">Telepon</Label>
                  <Input
                    id="telepon"
                    value={formData.telepon}
                    onChange={(e) => setFormData(prev => ({ ...prev, telepon: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className="bg-input/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jurusan">Jurusan</Label>
                  <Select
                    value={formData.jurusan_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, jurusan_id: value }))}
                  >
                    <SelectTrigger className="bg-input/50 border-border/50">
                      <SelectValue placeholder="Pilih jurusan" />
                    </SelectTrigger>
                    <SelectContent className="card-gradient border-border/50">
                      {jurusanList.map((jurusan) => (
                        <SelectItem key={jurusan.id} value={jurusan.id}>
                          {jurusan.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="glow-effect">
                    {editingGuru ? 'Simpan' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Daftar Guru Pembimbing
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : guruList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada data guru pembimbing</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Jurusan</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guruList.map((guru, index) => (
                    <TableRow key={guru.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{guru.nama}</TableCell>
                      <TableCell>{guru.nip || '-'}</TableCell>
                      <TableCell>{guru.email || '-'}</TableCell>
                      <TableCell>{guru.telepon || '-'}</TableCell>
                      <TableCell>
                        {guru.jurusan?.nama ? (
                          <Badge variant="outline">{guru.jurusan.nama}</Badge>
                        ) : '-'}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(guru)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/50 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(guru.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GuruPembimbingContent;
