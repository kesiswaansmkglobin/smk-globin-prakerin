import React, { useState, useEffect, useMemo } from 'react';
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
import TableSearch from '@/components/common/TableSearch';
import { useDebounce } from '@/hooks/useDebounce';

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
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('all');
  const [filterTingkat, setFilterTingkat] = useState('all');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [formData, setFormData] = useState({
    nama: '',
    jurusan_id: '',
    tingkat: 10,
    wali_kelas: ''
  });
  const { toast } = useToast();

  // Get user's jurusan_id for filtering
  const userJurusanId = user?.jurusan_id;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Build kelas query with jurusan filter for kaprog
      let kelasQuery = supabase
        .from('kelas')
        .select('*, jurusan(nama)')
        .order('created_at', { ascending: false });

      // Filter by jurusan for kaprog
      if (user?.role === 'kaprog' && userJurusanId) {
        kelasQuery = kelasQuery.eq('jurusan_id', userJurusanId);
      }

      const [kelasRes, jurusanRes] = await Promise.all([
        kelasQuery,
        supabase
          .from('jurusan')
          .select('*')
          .order('nama')
      ]);

      if (kelasRes.error) throw kelasRes.error;
      if (jurusanRes.error) throw jurusanRes.error;

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

  // Filtered data based on search and filters
  const filteredKelas = useMemo(() => {
    let data = kelas;
    
    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      data = data.filter((k: any) => 
        k.nama.toLowerCase().includes(query) ||
        (k.wali_kelas && k.wali_kelas.toLowerCase().includes(query))
      );
    }
    
    // Apply jurusan filter
    if (filterJurusan && filterJurusan !== 'all') {
      data = data.filter((k: any) => k.jurusan?.nama === filterJurusan);
    }
    
    // Apply tingkat filter
    if (filterTingkat && filterTingkat !== 'all') {
      data = data.filter((k: any) => k.tingkat.toString() === filterTingkat);
    }
    
    return data;
  }, [kelas, debouncedSearch, filterJurusan, filterTingkat]);

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Data Kelas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola data kelas sekolah</p>
        </div>

        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glow-effect" onClick={resetForm} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Tambah Kelas</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="dialog-surface border-border/50 overflow-hidden max-h-[90vh]">
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
                    className="bg-input/50 border-border/50"
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
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <GraduationCap className="mr-2 h-5 w-5" />
            Daftar Kelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableSearch
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Cari nama kelas atau wali kelas..."
            filters={[
              {
                value: filterTingkat,
                onChange: setFilterTingkat,
                options: [
                  { value: '10', label: 'Kelas X' },
                  { value: '11', label: 'Kelas XI' },
                  { value: '12', label: 'Kelas XII' }
                ],
                placeholder: 'Semua Tingkat'
              },
              ...(user?.role !== 'kaprog' ? [{
                value: filterJurusan,
                onChange: setFilterJurusan,
                options: jurusan.map((j: any) => ({ value: j.nama, label: j.nama })),
                placeholder: 'Semua Jurusan'
              }] : [])
            ]}
          />
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Memuat data...</div>
            </div>
          ) : filteredKelas.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                {searchQuery || filterJurusan !== 'all' || filterTingkat !== 'all' 
                  ? 'Tidak ada hasil pencarian' 
                  : 'Belum ada data kelas'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Kelas</TableHead>
                    <TableHead className="hidden sm:table-cell">Jurusan</TableHead>
                    <TableHead className="hidden md:table-cell">Tingkat</TableHead>
                    <TableHead className="hidden lg:table-cell">Wali Kelas</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKelas.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.nama}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {item.jurusan?.nama || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{item.jurusan?.nama || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.tingkat === 10 ? 'Kelas X' : 
                         item.tingkat === 11 ? 'Kelas XI' : 
                         item.tingkat === 12 ? 'Kelas XII' : '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{item.wali_kelas || '-'}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
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

export default KelasContent;