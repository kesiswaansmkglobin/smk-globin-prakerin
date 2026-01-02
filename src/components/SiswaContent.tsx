import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, UserCircle, Upload, ArrowUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImportSiswaDialog } from '@/components/ImportSiswaDialog';
import TableSearch from '@/components/common/TableSearch';
import { useDebounce } from '@/hooks/useDebounce';

import { canEditSiswa, shouldFilterByJurusan, getFilteredJurusan } from '@/utils/permissions';

interface SiswaContentProps {
  user: any;
}

const SiswaContent = ({ user }: SiswaContentProps) => {
  const canEdit = canEditSiswa(user);
  
  const [siswa, setSiswa] = useState([]);
  const [filteredSiswa, setFilteredSiswa] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('all');
  const [filterJurusan, setFilterJurusan] = useState('all');
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas_id: '',
    jurusan_id: '',
    jenis_kelamin: ''
  });
  const { toast } = useToast();

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Optimized queries with better error handling
      const promises = [
        supabase
          .from('siswa')
          .select('*, kelas(nama), jurusan(nama)')
          .order('nama'), // Changed to order by nama instead of created_at for better user experience
        supabase
          .from('kelas')
          .select('*')
          .order('nama'),
        supabase
          .from('jurusan')
          .select('*')
          .order('nama')
      ];

      const [siswaRes, kelasRes, jurusanRes] = await Promise.all(promises);

      // Handle errors properly
      if (siswaRes.error) {
        console.error('Siswa query error:', siswaRes.error);
        throw new Error('Gagal memuat data siswa');
      }
      if (kelasRes.error) {
        console.error('Kelas query error:', kelasRes.error);
        throw new Error('Gagal memuat data kelas');
      }
      if (jurusanRes.error) {
        console.error('Jurusan query error:', jurusanRes.error);
        throw new Error('Gagal memuat data jurusan');
      }

      setSiswa(siswaRes.data || []);
      setKelas(kelasRes.data || []);
      setJurusan(jurusanRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: error.message || "Tidak dapat memuat data",
        variant: "destructive",
      });
      setSiswa([]);
      setKelas([]);
      setJurusan([]);
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered data based on search and filters
  const displayedSiswa = useMemo(() => {
    let data = siswa;
    
    // Filter by user's jurusan for kaprog
    if (shouldFilterByJurusan(user)) {
      data = data.filter((s: any) => s.jurusan?.nama === user.jurusan);
    }
    
    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      data = data.filter((s: any) => 
        s.nama.toLowerCase().includes(query) ||
        s.nis.toLowerCase().includes(query)
      );
    }
    
    // Apply kelas filter
    if (filterKelas && filterKelas !== 'all') {
      data = data.filter((s: any) => s.kelas?.nama === filterKelas);
    }
    
    // Apply jurusan filter
    if (filterJurusan && filterJurusan !== 'all') {
      data = data.filter((s: any) => s.jurusan?.nama === filterJurusan);
    }
    
    return data;
  }, [siswa, debouncedSearch, filterKelas, filterJurusan, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSiswa) {
        const { error } = await supabase
          .from('siswa')
          .update(formData)
          .eq('id', editingSiswa.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data siswa berhasil diperbarui",
        });
      } else {
        const { error } = await supabase
          .from('siswa')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data siswa berhasil ditambahkan",
        });
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving siswa:', error);
      toast({
        title: "Error",
        description: "Tidak dapat menyimpan data siswa",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingSiswa(item);
    setFormData({
      nis: item.nis,
      nama: item.nama,
      kelas_id: item.kelas_id,
      jurusan_id: item.jurusan_id,
      jenis_kelamin: item.jenis_kelamin || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;

    try {
      const { error } = await supabase
        .from('siswa')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data siswa berhasil dihapus",
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting siswa:', error);
      toast({
        title: "Error",
        description: "Tidak dapat menghapus data siswa",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nis: '',
      nama: '',
      kelas_id: '',
      jurusan_id: '',
      jenis_kelamin: ''
    });
    setEditingSiswa(null);
    setDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  
  // Filter kelas dan jurusan untuk kaprog
  const filteredKelas = shouldFilterByJurusan(user)
    ? kelas.filter((k: any) => {
        const userJurusanData = jurusan.find((j: any) => j.nama === user.jurusan);
        return k.jurusan_id === userJurusanData?.id;
      })
    : kelas;
    
  const filteredJurusan = getFilteredJurusan(user, jurusan);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Data Siswa</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Kelola data siswa sekolah</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setImportDialogOpen(true)}
                size="sm"
                className="sm:size-default"
              >
                <Upload className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Impor CSV</span>
                <span className="sm:hidden">Impor</span>
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetForm} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Tambah Siswa</span>
                    <span className="sm:hidden">Tambah</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50 max-w-2xl overflow-hidden max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSiswa ? 'Edit Siswa' : 'Tambah Siswa Baru'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nis">NIS</Label>
                          <Input
                            id="nis"
                            name="nis"
                            value={formData.nis}
                            onChange={handleChange}
                            placeholder="Masukkan NIS"
                            required
                            className="bg-input/50 border-border/50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nama">Nama Lengkap</Label>
                          <Input
                            id="nama"
                            name="nama"
                            value={formData.nama}
                            onChange={handleChange}
                            placeholder="Masukkan nama lengkap"
                            required
                            className="bg-input/50 border-border/50"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="kelas_id">Kelas</Label>
                          <Select
                            value={formData.kelas_id}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, kelas_id: value }))}
                          >
                            <SelectTrigger className="bg-input/50 border-border/50">
                              <SelectValue placeholder="Pilih kelas" />
                            </SelectTrigger>
                            <SelectContent className="card-gradient border-border/50">
                              {filteredKelas.map((item: any) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="jurusan_id">Jurusan</Label>
                          <Select
                            value={formData.jurusan_id}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, jurusan_id: value }))}
                          >
                            <SelectTrigger className="bg-input/50 border-border/50">
                              <SelectValue placeholder="Pilih jurusan" />
                            </SelectTrigger>
                            <SelectContent className="card-gradient border-border/50">
                              {filteredJurusan.map((item: any) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                        <Select
                          value={formData.jenis_kelamin}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, jenis_kelamin: value }))}
                        >
                          <SelectTrigger className="bg-input/50 border-border/50">
                            <SelectValue placeholder="Pilih jenis kelamin" />
                          </SelectTrigger>
                          <SelectContent className="card-gradient border-border/50">
                            <SelectItem value="L">Laki-laki</SelectItem>
                            <SelectItem value="P">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={resetForm}>
                          Batal
                        </Button>
                        <Button type="submit" className="glow-effect">
                          {editingSiswa ? 'Perbarui' : 'Simpan'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <Card className="card-gradient border-border/50">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <UserCircle className="mr-2 h-5 w-5 text-primary" />
            Daftar Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableSearch
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Cari nama atau NIS..."
            filters={[
              {
                value: filterKelas,
                onChange: setFilterKelas,
                options: kelas.map((k: any) => ({ value: k.nama, label: k.nama })),
                placeholder: 'Semua Kelas'
              },
              ...(!shouldFilterByJurusan(user) ? [{
                value: filterJurusan,
                onChange: setFilterJurusan,
                options: jurusan.map((j: any) => ({ value: j.nama, label: j.nama })),
                placeholder: 'Semua Jurusan'
              }] : [])
            ]}
          />
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : displayedSiswa.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || filterKelas !== 'all' || filterJurusan !== 'all' 
                ? 'Tidak ada hasil pencarian' 
                : user?.role === 'kaprog' 
                  ? `Belum ada data siswa jurusan ${user.jurusan}` 
                  : 'Belum ada data siswa'}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">No</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden md:table-cell">Kelas</TableHead>
                    <TableHead className="hidden lg:table-cell">Jurusan</TableHead>
                    <TableHead className="hidden lg:table-cell">JK</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedSiswa.map((item: any, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="hidden sm:table-cell">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.nis}</TableCell>
                      <TableCell>
                        <div>
                          <div>{item.nama}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {item.kelas?.nama || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{item.kelas?.nama || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{item.jurusan?.nama || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{item.jenis_kelamin === 'L' ? 'L' : item.jenis_kelamin === 'P' ? 'P' : '-'}</TableCell>
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
                              className="border-destructive/50 text-destructive hover:bg-destructive/10 h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
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

      {/* Import Dialog */}
      <ImportSiswaDialog
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSuccess={loadData}
        kelasList={kelas}
        jurusanList={jurusan}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg glow-effect z-50"
          size="icon"
          title="Kembali ke atas"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default SiswaContent;