import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { canEditGuruPembimbing } from '@/utils/permissions';
import TableSearch from '@/components/common/TableSearch';
import { useDebounce } from '@/hooks/useDebounce';

interface GuruPembimbingContentProps {
  user: any;
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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState<GuruPembimbing | null>(null);
  const [editingGuru, setEditingGuru] = useState<GuruPembimbing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    email: '',
    telepon: ''
  });
  const [credentialForm, setCredentialForm] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const guruQuery = supabase
        .from('guru_pembimbing')
        .select('*')
        .order('nama');

      const guruRes = await guruQuery;

      if (guruRes.error) throw guruRes.error;

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
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered data based on search
  const filteredGuruList = useMemo(() => {
    if (!debouncedSearch) return guruList;
    
    const query = debouncedSearch.toLowerCase();
    return guruList.filter(guru => 
      guru.nama.toLowerCase().includes(query) ||
      (guru.nip && guru.nip.toLowerCase().includes(query)) ||
      (guru.email && guru.email.toLowerCase().includes(query))
    );
  }, [guruList, debouncedSearch]);

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
        telepon: formData.telepon || null
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
      telepon: guru.telepon || ''
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
      telepon: ''
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
          <TableSearch
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Cari nama, NIP, atau email..."
          />
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : filteredGuruList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada data guru pembimbing'}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden md:table-cell">NIP</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Telepon</TableHead>
                    <TableHead>Akun Login</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuruList.map((guru, index) => (
                    <TableRow key={guru.id}>
                      <TableCell className="hidden sm:table-cell">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{guru.nama}</div>
                          <div className="text-xs text-muted-foreground md:hidden">{guru.nip || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{guru.nip || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{guru.email || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{guru.telepon || '-'}</TableCell>
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
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCredentialDialog(guru)}
                              title="Set Akun Login"
                              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(guru)} className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive/50 text-destructive hover:bg-destructive/10 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
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
