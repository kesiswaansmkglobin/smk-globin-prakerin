import React, { useState } from 'react';
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
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';

interface PenggunaContentProps {
  user: any;
}

const PenggunaContent = ({ user }: PenggunaContentProps) => {
  // Use optimized hooks for better performance with better error handling
  const { data: users = [], loading: usersLoading, error: usersError, refetch: refetchUsers } = useSupabaseQuery({
    table: 'users',
    select: '*',
    orderBy: { column: 'name', ascending: true }
  });

  const { data: jurusan = [], loading: jurusanLoading, error: jurusanError } = useSupabaseQuery({
    table: 'jurusan',
    select: '*', 
    orderBy: { column: 'nama', ascending: true }
  });

  const loading = usersLoading || jurusanLoading;
  const hasError = usersError || jurusanError;

  // Debug logging
  console.log('PenggunaContent state:', { 
    users: users.length, 
    jurusan: jurusan.length, 
    loading, 
    usersError, 
    jurusanError 
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    jurusan: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Form submission started');
      console.log('Form data:', { ...formData, password: '[HIDDEN]' });
      
      if (editingUser) {
        // For updates, use RPC to properly hash password if provided
        if (formData.password) {
          console.log('Hashing password for update');
          const { data: hashedPassword, error: hashError } = await supabase
            .rpc('hash_password', { password: formData.password });
          
          console.log('Hash result:', { hashedPassword: hashedPassword ? '[HASHED]' : null, hashError });
          if (hashError) throw hashError;
        }
        
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        } else {
          // Hash the password before updating
          console.log('Hashing password for update (second call)');
          const { data: hashedPassword, error: hashError } = await supabase
            .rpc('hash_password', { password: updateData.password });
          console.log('Hash result for update:', { hashedPassword: hashedPassword ? '[HASHED]' : null, hashError });
          if (hashError) throw hashError;
          updateData.password = hashedPassword;
        }

        console.log('Updating user with data:', { ...updateData, password: updateData.password ? '[HASHED]' : undefined });
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
        console.log('Hashing password for new user');
        const { data: hashedPassword, error: hashError } = await supabase
          .rpc('hash_password', { password: formData.password });
          
        console.log('Hash result for new user:', { hashedPassword: hashedPassword ? '[HASHED]' : null, hashError });
        if (hashError) {
          console.error('Hash error details:', hashError);
          throw hashError;
        }

        console.log('Inserting new user');
        const { error } = await supabase
          .from('users')
          .insert([{ 
            ...formData, 
            password: hashedPassword,
            role: 'kaprog' 
          }]);

        console.log('Insert result:', { error });
        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data pengguna berhasil ditambahkan"
        });
      }

      setDialogOpen(false);
      setFormData({ name: '', username: '', password: '', jurusan: '' });
      setEditingUser(null);
      refetchUsers(); // Use refetch instead of loadData
    } catch (error) {
      console.error('Submit error:', error);
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
      
      refetchUsers(); // Use refetch instead of loadData
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
          <DialogContent className="card-gradient no-hover-transform border-border/50 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              Memuat data pengguna...
            </div>
          ) : hasError ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-destructive">Error: {usersError || jurusanError}</p>
              <button 
                onClick={() => {
                  refetchUsers();
                  window.location.reload();
                }}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Coba Lagi
              </button>
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