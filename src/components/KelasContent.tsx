import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { canEditKelas } from '@/utils/permissions';

interface KelasContentProps {
  user: any;
}

const KelasContent = ({ user }: KelasContentProps) => {
  const canEdit = canEditKelas(user);
  const [kelas, setKelas] = useState([]);
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    jurusan_id: '',
    tingkat: 10,
    wali_kelas: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kelasRes, jurusanRes] = await Promise.all([
        supabase
          .from('kelas')
          .select('*, jurusan(nama)')
          .order('created_at', { ascending: false }),
        supabase
          .from('jurusan')
          .select('*')
          .order('nama')
      ]);

      if (kelasRes.error) throw kelasRes.error;
      if (jurusanRes.error) throw jurusanRes.error;

      console.log('Kelas data loaded:', kelasRes.data?.length || 0);
      console.log('Jurusan data loaded:', jurusanRes.data?.length || 0);
      
      setKelas(kelasRes.data || []);
      setJurusan(jurusanRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Tidak dapat memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingKelas) {
        const { error } = await supabase
          .from('kelas')
          .update(formData)
          .eq('id', editingKelas.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data kelas berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from('kelas')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data kelas berhasil ditambahkan",
        });
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving kelas:', error);
      toast({
        title: "Error",
        description: "Tidak dapat menyimpan data kelas",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingKelas(item);
    setFormData({
      nama: item.nama,
      jurusan_id: item.jurusan_id,
      tingkat: item.tingkat,
      wali_kelas: item.wali_kelas || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;

    try {
      const { error } = await supabase
        .from('kelas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data kelas berhasil dihapus",
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting kelas:', error);
      toast({
        title: "Error",
        description: "Tidak dapat menghapus data kelas",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      jurusan_id: '',
      tingkat: 10,
      wali_kelas: ''
    });
    setEditingKelas(null);
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
          <h1 className="text-3xl font-bold text-primary">Data Kelas</h1>
          <p className="text-muted-foreground">Kelola data kelas sekolah</p>
        </div>

        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glow-effect" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kelas
              </Button>
            </DialogTrigger>
          <DialogContent className="dialog-surface border-border/50 overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {editingKelas ? 'Edit Kelas' : 'Tambah Kelas Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nama">Nama Kelas</Label>
                  <Input
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Masukkan nama kelas"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="jurusan_id">Jurusan</Label>
                  <Select
                    value={formData.jurusan_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, jurusan_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jurusan" />
                    </SelectTrigger>
                    <SelectContent>
                      {jurusan.map((item: any) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tingkat">Tingkat</Label>
                  <Select
                    value={formData.tingkat.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tingkat: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tingkat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Kelas X</SelectItem>
                      <SelectItem value="11">Kelas XI</SelectItem>
                      <SelectItem value="12">Kelas XII</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="wali_kelas">Wali Kelas</Label>
                  <Input
                    id="wali_kelas"
                    name="wali_kelas"
                    value={formData.wali_kelas}
                    onChange={handleChange}
                    placeholder="Masukkan nama wali kelas"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingKelas ? 'Perbarui' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            Daftar Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Memuat data...</div>
            </div>
          ) : kelas.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Belum ada data kelas</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kelas</TableHead>
                  <TableHead>Jurusan</TableHead>
                  <TableHead>Tingkat</TableHead>
                  <TableHead>Wali Kelas</TableHead>
                  {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {kelas.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell>{item.jurusan?.nama || '-'}</TableCell>
                    <TableCell>
                      {item.tingkat === 10 ? 'Kelas X' : 
                       item.tingkat === 11 ? 'Kelas XI' : 
                       item.tingkat === 12 ? 'Kelas XII' : '-'}
                    </TableCell>
                    <TableCell>{item.wali_kelas || '-'}</TableCell>
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

export default KelasContent;