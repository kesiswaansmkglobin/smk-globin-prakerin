import React, { useState, useEffect } from 'react';
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

interface PenggunaContentProps {
  user: any;
}

const PenggunaContent = ({ user }: PenggunaContentProps) => {
  const [users, setUsers] = useState([]);
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    jurusan: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, jurusanRes] = await Promise.all([
        supabase.from('users').select('*').order('name'),
        supabase.from('jurusan').select('*').order('nama')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (jurusanRes.error) throw jurusanRes.error;

      setUsers(usersRes.data || []);
      setJurusan(jurusanRes.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // For updates, use RPC to properly hash password if provided
        if (formData.password) {
          const { error } = await supabase.rpc('hash_password', {
            password: formData.password
          });
          if (error) throw error;
        }
        
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        } else {
          // Hash the password before updating
          const { data: hashedPassword, error: hashError } = await supabase
            .rpc('hash_password', { password: updateData.password });
          if (hashError) throw hashError;
          updateData.password = hashedPassword;
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data pengguna berhasil diperbarui"
        });
      } else {
        // For new users, hash the password first
        const { data: hashedPassword, error: hashError } = await supabase
          .rpc('hash_password', { password: formData.password });
        if (hashError) throw hashError;

        const { error } = await supabase
          .from('users')
          .insert([{ 
            ...formData, 
            password: hashedPassword,
            role: 'kaprog' 
          }]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data pengguna berhasil ditambahkan"
        });
      }

      setDialogOpen(false);
      setFormData({ name: '', username: '', password: '', jurusan: '' });
      setEditingUser(null);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '', // Don't pre-fill password
      jurusan: user.jurusan
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data pengguna berhasil dihapus"
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus data pengguna",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', username: '', password: '', jurusan: '' });
    setEditingUser(null);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Data Pengguna</h1>
          <p className="text-muted-foreground">Kelola akun Kepala Program</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="glow-effect" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent className="card-gradient border-border/50">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="bg-input/50 border-border/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username (Email)</Label>
                <Input
                  id="username"
                  type="email"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="contoh@smkglobin.sch.id"
                  required
                  className="bg-input/50 border-border/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingUser && '(Kosongkan jika tidak ingin mengubah)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Masukkan password"
                  required={!editingUser}
                  className="bg-input/50 border-border/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="jurusan">Jurusan</Label>
                <Select 
                  value={formData.jurusan} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, jurusan: value }))}
                >
                  <SelectTrigger className="bg-input/50 border-border/50">
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent className="card-gradient border-border/50">
                    {jurusan.map((item) => (
                      <SelectItem key={item.id} value={item.nama}>
                        {item.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
                <Button type="submit" className="glow-effect">
                  {editingUser ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Daftar Kepala Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data pengguna
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Jurusan</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.jurusan}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.role === 'kaprog' ? 'Kepala Program' : user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PenggunaContent;