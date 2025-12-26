import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { canEditGuruPembimbing } from '@/utils/permissions';

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
  username: string | null;
  jurusan?: { nama: string } | null;
}

const GuruPembimbingContent = ({ user }: GuruPembimbingContentProps) => {
  const [guruList, setGuruList] = useState<GuruPembimbing[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState<GuruPembimbing | null>(null);
  const [editingGuru, setEditingGuru] = useState<GuruPembimbing | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    email: '',
    telepon: '',
    jurusan_id: ''
  });
  const [credentialForm, setCredentialForm] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      // Load all guru pembimbing - no filter by jurusan since they're general
      let guruQuery = supabase
        .from('guru_pembimbing')
        .select('*, jurusan(nama)')
        .order('nama');

      const jurusanQuery = supabase
        .from('jurusan')
        .select('id, nama')
        .order('nama');

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

  const handleSetCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGuru) return;
    
    if (credentialForm.password !== credentialForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok",
        variant: "destructive"
      });
      return;
    }

    if (credentialForm.password.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive"
      });
      return;
    }

    try {
      // Hash password using database function
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_password', { password: credentialForm.password });

      if (hashError) throw hashError;

      // Update guru pembimbing with username and password
      const { error } = await supabase
        .from('guru_pembimbing')
        .update({
          username: credentialForm.username,
          password: hashedPassword
        })
        .eq('id', selectedGuru.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Akun login untuk ${selectedGuru.nama} berhasil dibuat. Username: ${credentialForm.username}`
      });

      setCredentialDialogOpen(false);
      setCredentialForm({ username: '', password: '', confirmPassword: '' });
      setSelectedGuru(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat akun login",
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

  const handleOpenCredentialDialog = (guru: GuruPembimbing) => {
    setSelectedGuru(guru);
    setCredentialForm({
      username: guru.username || guru.nip || '',
      password: '',
      confirmPassword: ''
    });
    setCredentialDialogOpen(true);
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

  const canEdit = canEditGuruPembimbing(user);

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

      {/* Credential Dialog */}
      <Dialog open={credentialDialogOpen} onOpenChange={setCredentialDialogOpen}>
        <DialogContent className="dialog-surface border-border/50">
          <DialogHeader>
            <DialogTitle>
              Set Akun Login - {selectedGuru?.nama}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetCredential} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cred_username">Username *</Label>
              <Input
                id="cred_username"
                value={credentialForm.username}
                onChange={(e) => setCredentialForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Username untuk login"
                className="bg-input/50 border-border/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cred_password">Password *</Label>
              <Input
                id="cred_password"
                type="password"
                value={credentialForm.password}
                onChange={(e) => setCredentialForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Minimal 6 karakter"
                className="bg-input/50 border-border/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cred_confirm">Konfirmasi Password *</Label>
              <Input
                id="cred_confirm"
                type="password"
                value={credentialForm.confirmPassword}
                onChange={(e) => setCredentialForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Ulangi password"
                className="bg-input/50 border-border/50"
                required
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setCredentialDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="glow-effect">
                Simpan Akun
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                    <TableHead>Akun Login</TableHead>
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
                      <TableCell>
                        {guru.username ? (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                            {guru.username}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Belum ada</Badge>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCredentialDialog(guru)}
                              title="Set Akun Login"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
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
