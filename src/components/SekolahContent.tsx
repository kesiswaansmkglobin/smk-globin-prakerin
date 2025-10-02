import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, School } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { canEditSekolah } from '@/utils/permissions';

interface SekolahContentProps {
  user: any;
}

const SekolahContent = ({ user }: SekolahContentProps) => {
  const canEdit = canEditSekolah(user);
  const [sekolah, setSekolah] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSekolah, setEditingSekolah] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    telepon: '',
    email: '',
    kepala_sekolah: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSekolah();
  }, []);

  const loadSekolah = async () => {
    try {
      const { data, error } = await supabase
        .from('sekolah')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSekolah(data || []);
    } catch (error) {
      console.error('Error loading sekolah:', error);
      toast({
        title: "Error",
        description: "Tidak dapat memuat data sekolah",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSekolah) {
        const { error } = await supabase
          .from('sekolah')
          .update(formData)
          .eq('id', editingSekolah.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data sekolah berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from('sekolah')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data sekolah berhasil ditambahkan",
        });
      }

      resetForm();
      loadSekolah();
    } catch (error) {
      console.error('Error saving sekolah:', error);
      toast({
        title: "Error",
        description: "Tidak dapat menyimpan data sekolah",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingSekolah(item);
    setFormData({
      nama: item.nama,
      alamat: item.alamat || '',
      telepon: item.telepon || '',
      email: item.email || '',
      kepala_sekolah: item.kepala_sekolah || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data sekolah ini?')) return;

    try {
      const { error } = await supabase
        .from('sekolah')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data sekolah berhasil dihapus",
      });
      
      loadSekolah();
    } catch (error) {
      console.error('Error deleting sekolah:', error);
      toast({
        title: "Error",
        description: "Tidak dapat menghapus data sekolah",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      alamat: '',
      telepon: '',
      email: '',
      kepala_sekolah: ''
    });
    setEditingSekolah(null);
    setDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Data Sekolah</h1>
          <p className="text-muted-foreground">Kelola informasi sekolah</p>
        </div>

        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glow-effect" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Sekolah
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSekolah ? 'Edit Sekolah' : 'Tambah Sekolah Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nama">Nama Sekolah</Label>
                <Input
                  id="nama"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama sekolah"
                  required
                />
              </div>
              <div>
                <Label htmlFor="alamat">Alamat</Label>
                <Input
                  id="alamat"
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="Masukkan alamat sekolah"
                />
              </div>
              <div>
                <Label htmlFor="telepon">Telepon</Label>
                <Input
                  id="telepon"
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleChange}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Masukkan email sekolah"
                />
              </div>
              <div>
                <Label htmlFor="kepala_sekolah">Kepala Sekolah</Label>
                <Input
                  id="kepala_sekolah"
                  name="kepala_sekolah"
                  value={formData.kepala_sekolah}
                  onChange={handleChange}
                  placeholder="Masukkan nama kepala sekolah"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingSekolah ? 'Perbarui' : 'Simpan'}
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
            <School className="mr-2 h-5 w-5" />
            Daftar Sekolah
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Memuat data...</div>
            </div>
          ) : sekolah.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Belum ada data sekolah</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Sekolah</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Kepala Sekolah</TableHead>
                  {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sekolah.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell>{item.alamat || '-'}</TableCell>
                    <TableCell>{item.telepon || '-'}</TableCell>
                    <TableCell>{item.kepala_sekolah || '-'}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SekolahContent;