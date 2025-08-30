import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, UserCircle, Upload, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SiswaContentProps {
  user: any;
}

const SiswaContent = ({ user }: SiswaContentProps) => {
  const [siswa, setSiswa] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    kelas_id: '',
    jurusan_id: '',
    jenis_kelamin: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    telepon: '',
    email: '',
    nama_orangtua: '',
    telepon_orangtua: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [siswaRes, kelasRes, jurusanRes] = await Promise.all([
        supabase
          .from('siswa')
          .select('*, kelas(nama), jurusan(nama)')
          .order('created_at', { ascending: false }),
        supabase
          .from('kelas')
          .select('*')
          .order('nama'),
        supabase
          .from('jurusan')
          .select('*')
          .order('nama')
      ]);

      if (siswaRes.error) throw siswaRes.error;
      if (kelasRes.error) throw kelasRes.error;
      if (jurusanRes.error) throw jurusanRes.error;

      setSiswa(siswaRes.data || []);
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
      jenis_kelamin: item.jenis_kelamin || '',
      tempat_lahir: item.tempat_lahir || '',
      tanggal_lahir: item.tanggal_lahir || '',
      alamat: item.alamat || '',
      telepon: item.telepon || '',
      email: item.email || '',
      nama_orangtua: item.nama_orangtua || '',
      telepon_orangtua: item.telepon_orangtua || ''
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
      jenis_kelamin: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      alamat: '',
      telepon: '',
      email: '',
      nama_orangtua: '',
      telepon_orangtua: ''
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

  const downloadTemplate = () => {
    const csvContent = `NIS,NAMA,KELAS_ID,JURUSAN_ID,JENIS_KELAMIN,TEMPAT_LAHIR,TANGGAL_LAHIR,ALAMAT,TELEPON,EMAIL,NAMA_ORANGTUA,TELEPON_ORANGTUA
12345,Contoh Nama,pilih-dari-kelas,pilih-dari-jurusan,L,Jakarta,2005-01-01,Jl. Contoh,08123456789,email@contoh.com,Nama Orangtua,08198765432`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_siswa.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Data Siswa</h1>
          <p className="text-muted-foreground">Kelola data siswa sekolah</p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glow-effect" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSiswa ? 'Edit Siswa' : 'Tambah Siswa Baru'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
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
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelas.map((item: any) => (
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
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                    <Select
                      value={formData.jenis_kelamin}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, jenis_kelamin: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                    <Input
                      id="tempat_lahir"
                      name="tempat_lahir"
                      value={formData.tempat_lahir}
                      onChange={handleChange}
                      placeholder="Tempat lahir"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                    <Input
                      id="tanggal_lahir"
                      name="tanggal_lahir"
                      type="date"
                      value={formData.tanggal_lahir}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="alamat">Alamat</Label>
                  <Input
                    id="alamat"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                    placeholder="Masukkan alamat"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telepon">Telepon</Label>
                    <Input
                      id="telepon"
                      name="telepon"
                      value={formData.telepon}
                      onChange={handleChange}
                      placeholder="Nomor telepon"
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
                      placeholder="Email siswa"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nama_orangtua">Nama Orangtua</Label>
                    <Input
                      id="nama_orangtua"
                      name="nama_orangtua"
                      value={formData.nama_orangtua}
                      onChange={handleChange}
                      placeholder="Nama orangtua/wali"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telepon_orangtua">Telepon Orangtua</Label>
                    <Input
                      id="telepon_orangtua"
                      name="telepon_orangtua"
                      value={formData.telepon_orangtua}
                      onChange={handleChange}
                      placeholder="Telepon orangtua"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingSiswa ? 'Perbarui' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCircle className="mr-2 h-5 w-5" />
            Daftar Siswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Memuat data...</div>
            </div>
          ) : siswa.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Belum ada data siswa</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIS</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Jurusan</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siswa.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nis}</TableCell>
                    <TableCell>{item.nama}</TableCell>
                    <TableCell>{item.kelas?.nama || '-'}</TableCell>
                    <TableCell>{item.jurusan?.nama || '-'}</TableCell>
                    <TableCell>{item.jenis_kelamin === 'L' ? 'Laki-laki' : item.jenis_kelamin === 'P' ? 'Perempuan' : '-'}</TableCell>
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

export default SiswaContent;