import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JurusanContentProps {
  user: any;
}

const JurusanContent = ({ user }: JurusanContentProps) => {
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJurusan, setEditingJurusan] = useState(null);
  const [formData, setFormData] = useState({ nama: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadJurusan();
  }, []);

  const loadJurusan = async () => {
    try {
      const { data, error } = await supabase
        .from('jurusan')
        .select('*')
        .order('nama');

      if (error) throw error;
      setJurusan(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data jurusan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingJurusan) {
        const { error } = await supabase
          .from('jurusan')
          .update({ nama: formData.nama })
          .eq('id', editingJurusan.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data jurusan berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('jurusan')
          .insert([{ nama: formData.nama }]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data jurusan berhasil ditambahkan"
        });
      }

      setDialogOpen(false);
      setFormData({ nama: '' });
      setEditingJurusan(null);
      loadJurusan();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item) => {
    setEditingJurusan(item);
    setFormData({ nama: item.nama });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jurusan ini?')) return;

    try {
      const { error } = await supabase
        .from('jurusan')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data jurusan berhasil dihapus"
      });
      
      loadJurusan();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus data jurusan",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({ nama: '' });
    setEditingJurusan(null);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Data Jurusan</h1>
          <p className="text-muted-foreground">Kelola data jurusan SMK GLOBIN</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="glow-effect" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jurusan
            </Button>
          </DialogTrigger>
          <DialogContent className="card-gradient border-border/50">
            <DialogHeader>
              <DialogTitle>
                {editingJurusan ? 'Edit Jurusan' : 'Tambah Jurusan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Jurusan</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ nama: e.target.value })}
                  placeholder="Masukkan nama jurusan"
                  required
                  className="bg-input/50 border-border/50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
                <Button type="submit" className="glow-effect">
                  {editingJurusan ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Daftar Jurusan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : jurusan.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data jurusan
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Jurusan</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jurusan.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
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

export default JurusanContent;