import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, ClipboardList, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface BimbinganContentProps {
  user: any;
}

interface Prakerin {
  id: string;
  siswa: {
    nama: string;
    nis: string;
    kelas: { nama: string } | null;
  } | null;
  tempat_prakerin: string | null;
}

interface GuruPembimbing {
  id: string;
  nama: string;
}

interface Bimbingan {
  id: string;
  prakerin_id: string;
  guru_pembimbing_id: string;
  tanggal: string;
  kegiatan: string;
  catatan: string | null;
  paraf: boolean;
  prakerin?: {
    siswa: { nama: string; nis: string } | null;
    tempat_prakerin: string | null;
  } | null;
  guru_pembimbing?: { nama: string } | null;
}

const BimbinganContent = ({ user }: BimbinganContentProps) => {
  const [bimbinganList, setBimbinganList] = useState<Bimbingan[]>([]);
  const [prakerinList, setPrakerinList] = useState<Prakerin[]>([]);
  const [guruList, setGuruList] = useState<GuruPembimbing[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBimbingan, setEditingBimbingan] = useState<Bimbingan | null>(null);
  const [formData, setFormData] = useState({
    prakerin_id: '',
    guru_pembimbing_id: '',
    tanggal: '',
    kegiatan: '',
    catatan: '',
    paraf: false
  });
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      // Get user's jurusan_id if kaprog
      let userJurusanId: string | null = null;
      if (user?.role === 'kaprog') {
        const { data: jurusanData } = await supabase
          .from('jurusan')
          .select('id')
          .eq('nama', user.jurusan)
          .single();
        userJurusanId = jurusanData?.id || null;
      }

      // Load bimbingan with relations
      let bimbinganQuery = supabase
        .from('bimbingan')
        .select(`
          *,
          prakerin(
            siswa(nama, nis),
            tempat_prakerin
          ),
          guru_pembimbing(nama)
        `)
        .order('tanggal', { ascending: false });

      // Load prakerin for dropdown
      let prakerinQuery = supabase
        .from('prakerin')
        .select(`
          id,
          tempat_prakerin,
          siswa!inner(nama, nis, jurusan_id, kelas(nama))
        `)
        .order('created_at', { ascending: false });

      // Load guru pembimbing for dropdown
      let guruQuery = supabase
        .from('guru_pembimbing')
        .select('id, nama')
        .order('nama');

      // Filter by jurusan if kaprog
      if (user?.role === 'kaprog' && userJurusanId) {
        prakerinQuery = prakerinQuery.eq('siswa.jurusan_id', userJurusanId);
        guruQuery = guruQuery.eq('jurusan_id', userJurusanId);
      }

      const [bimbinganRes, prakerinRes, guruRes] = await Promise.all([
        bimbinganQuery,
        prakerinQuery,
        guruQuery
      ]);

      if (bimbinganRes.error) throw bimbinganRes.error;
      if (prakerinRes.error) throw prakerinRes.error;
      if (guruRes.error) throw guruRes.error;

      setBimbinganList(bimbinganRes.data || []);
      setPrakerinList(prakerinRes.data || []);
      setGuruList(guruRes.data || []);
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
    table: 'bimbingan',
    onInsert: loadData,
    onUpdate: loadData,
    onDelete: loadData,
    showToast: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        prakerin_id: formData.prakerin_id,
        guru_pembimbing_id: formData.guru_pembimbing_id,
        tanggal: formData.tanggal,
        kegiatan: formData.kegiatan,
        catatan: formData.catatan || null,
        paraf: formData.paraf
      };

      if (editingBimbingan) {
        const { error } = await supabase
          .from('bimbingan')
          .update(data)
          .eq('id', editingBimbingan.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data bimbingan berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('bimbingan')
          .insert([data]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data bimbingan berhasil ditambahkan"
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

  const handleEdit = (bimbingan: Bimbingan) => {
    setEditingBimbingan(bimbingan);
    setFormData({
      prakerin_id: bimbingan.prakerin_id,
      guru_pembimbing_id: bimbingan.guru_pembimbing_id,
      tanggal: bimbingan.tanggal,
      kegiatan: bimbingan.kegiatan,
      catatan: bimbingan.catatan || '',
      paraf: bimbingan.paraf
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data bimbingan ini?')) return;

    try {
      const { error } = await supabase
        .from('bimbingan')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data bimbingan berhasil dihapus"
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

  const handleToggleParaf = async (bimbingan: Bimbingan) => {
    try {
      const { error } = await supabase
        .from('bimbingan')
        .update({ paraf: !bimbingan.paraf })
        .eq('id', bimbingan.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: bimbingan.paraf ? "Paraf dibatalkan" : "Paraf berhasil"
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengubah paraf",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      prakerin_id: '',
      guru_pembimbing_id: '',
      tanggal: '',
      kegiatan: '',
      catatan: '',
      paraf: false
    });
    setEditingBimbingan(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canEdit = user?.role === 'admin' || user?.role === 'kaprog';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Catatan Bimbingan</h1>
          <p className="text-muted-foreground">Kelola catatan bimbingan prakerin</p>
        </div>

        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glow-effect" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Bimbingan
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-surface border-border/50 max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingBimbingan ? 'Edit Bimbingan' : 'Tambah Bimbingan'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prakerin">Siswa Prakerin *</Label>
                  <Select
                    value={formData.prakerin_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, prakerin_id: value }))}
                  >
                    <SelectTrigger className="bg-input/50 border-border/50">
                      <SelectValue placeholder="Pilih siswa prakerin" />
                    </SelectTrigger>
                    <SelectContent className="card-gradient border-border/50">
                      {prakerinList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.siswa?.nama} - {p.siswa?.nis} ({p.tempat_prakerin})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guru">Guru Pembimbing *</Label>
                  <Select
                    value={formData.guru_pembimbing_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, guru_pembimbing_id: value }))}
                  >
                    <SelectTrigger className="bg-input/50 border-border/50">
                      <SelectValue placeholder="Pilih guru pembimbing" />
                    </SelectTrigger>
                    <SelectContent className="card-gradient border-border/50">
                      {guruList.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal Bimbingan *</Label>
                  <Input
                    id="tanggal"
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                    className="bg-input/50 border-border/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kegiatan">Nama Kegiatan *</Label>
                  <Input
                    id="kegiatan"
                    value={formData.kegiatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, kegiatan: e.target.value }))}
                    placeholder="Contoh: Monitoring minggu ke-1"
                    className="bg-input/50 border-border/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="catatan">Catatan</Label>
                  <Textarea
                    id="catatan"
                    value={formData.catatan}
                    onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                    placeholder="Catatan tambahan..."
                    className="bg-input/50 border-border/50"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="paraf"
                    checked={formData.paraf}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, paraf: checked as boolean }))}
                  />
                  <Label htmlFor="paraf" className="cursor-pointer">Sudah Paraf</Label>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="glow-effect">
                    {editingBimbingan ? 'Simpan' : 'Tambah'}
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
            <ClipboardList className="mr-2 h-5 w-5 text-primary" />
            Daftar Catatan Bimbingan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : bimbinganList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada data bimbingan</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Tempat Prakerin</TableHead>
                    <TableHead>Kegiatan</TableHead>
                    <TableHead>Pembimbing</TableHead>
                    <TableHead>Paraf</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bimbinganList.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{formatDate(item.tanggal)}</TableCell>
                      <TableCell className="font-medium">
                        {item.prakerin?.siswa?.nama || '-'}
                      </TableCell>
                      <TableCell>{item.prakerin?.tempat_prakerin || '-'}</TableCell>
                      <TableCell>{item.kegiatan}</TableCell>
                      <TableCell>{item.guru_pembimbing?.nama || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={item.paraf ? "default" : "outline"}
                          onClick={() => handleToggleParaf(item)}
                          className={item.paraf ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/50 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item.id)}
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

export default BimbinganContent;
