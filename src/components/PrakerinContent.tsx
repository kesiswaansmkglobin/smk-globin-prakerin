import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PrakerinContentProps {
  user: any;
}

const PrakerinContent = ({ user }: PrakerinContentProps) => {
  const [prakerin, setPrakerin] = useState([]);
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrakerin, setEditingPrakerin] = useState(null);
  const [formData, setFormData] = useState({
    nis: '',
    nama_siswa: '',
    jurusan: '',
    kelas: '',
    tempat_prakerin: '',
    alamat_prakerin: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    pembimbing_sekolah: '',
    pembimbing_industri: '',
    nilai_akhir: '',
    keterangan: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [prakerinRes, jurusanRes] = await Promise.all([
        user?.role === 'admin' 
          ? supabase.from('prakerin').select('*').order('created_at', { ascending: false })
          : supabase.from('prakerin').select('*').eq('jurusan', user?.jurusan).order('created_at', { ascending: false }),
        supabase.from('jurusan').select('*').order('nama')
      ]);

      if (prakerinRes.error) throw prakerinRes.error;
      if (jurusanRes.error) throw jurusanRes.error;

      setPrakerin(prakerinRes.data || []);
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
      const data = {
        ...formData,
        nilai_akhir: formData.nilai_akhir ? parseInt(formData.nilai_akhir) : null
      };

      if (editingPrakerin) {
        const { error } = await supabase
          .from('prakerin')
          .update(data)
          .eq('id', editingPrakerin.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data prakerin berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('prakerin')
          .insert([data]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data prakerin berhasil ditambahkan"
        });
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item) => {
    setEditingPrakerin(item);
    setFormData({
      nis: item.nis || '',
      nama_siswa: item.nama_siswa || '',
      jurusan: item.jurusan || '',
      kelas: item.kelas || '',
      tempat_prakerin: item.tempat_prakerin || '',
      alamat_prakerin: item.alamat_prakerin || '',
      tanggal_mulai: item.tanggal_mulai || '',
      tanggal_selesai: item.tanggal_selesai || '',
      pembimbing_sekolah: item.pembimbing_sekolah || '',
      pembimbing_industri: item.pembimbing_industri || '',
      nilai_akhir: item.nilai_akhir?.toString() || '',
      keterangan: item.keterangan || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data prakerin ini?')) return;

    try {
      const { error } = await supabase
        .from('prakerin')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data prakerin berhasil dihapus"
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus data prakerin",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nis: '',
      nama_siswa: '',
      jurusan: user?.role === 'kaprog' ? user.jurusan : '',
      kelas: '',
      tempat_prakerin: '',
      alamat_prakerin: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      pembimbing_sekolah: '',
      pembimbing_industri: '',
      nilai_akhir: '',
      keterangan: ''
    });
    setEditingPrakerin(null);
    setDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const canEdit = user?.role === 'admin' || user?.role === 'kaprog';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Data Prakerin</h1>
          <p className="text-muted-foreground">
            {user?.role === 'kaprog' 
              ? `Kelola data prakerin jurusan ${user.jurusan}` 
              : 'Kelola data praktik kerja industri'
            }
          </p>
        </div>
        
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glow-effect" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Data Prakerin
              </Button>
            </DialogTrigger>
            <DialogContent className="card-gradient border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPrakerin ? 'Edit Data Prakerin' : 'Tambah Data Prakerin'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nis">NIS</Label>
                    <Input
                      id="nis"
                      value={formData.nis}
                      onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value }))}
                      placeholder="Nomor Induk Siswa"
                      required
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nama_siswa">Nama Siswa</Label>
                    <Input
                      id="nama_siswa"
                      value={formData.nama_siswa}
                      onChange={(e) => setFormData(prev => ({ ...prev, nama_siswa: e.target.value }))}
                      placeholder="Nama lengkap siswa"
                      required
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jurusan">Jurusan</Label>
                    <Select 
                      value={formData.jurusan} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, jurusan: value }))}
                      disabled={user?.role === 'kaprog'}
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="kelas">Kelas</Label>
                    <Input
                      id="kelas"
                      value={formData.kelas}
                      onChange={(e) => setFormData(prev => ({ ...prev, kelas: e.target.value }))}
                      placeholder="XII RPL 1"
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempat_prakerin">Tempat Prakerin</Label>
                  <Input
                    id="tempat_prakerin"
                    value={formData.tempat_prakerin}
                    onChange={(e) => setFormData(prev => ({ ...prev, tempat_prakerin: e.target.value }))}
                    placeholder="PT. ABC / CV. XYZ"
                    className="bg-input/50 border-border/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alamat_prakerin">Alamat Prakerin</Label>
                  <Input
                    id="alamat_prakerin"
                    value={formData.alamat_prakerin}
                    onChange={(e) => setFormData(prev => ({ ...prev, alamat_prakerin: e.target.value }))}
                    placeholder="Alamat lengkap tempat prakerin"
                    className="bg-input/50 border-border/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                    <Input
                      id="tanggal_mulai"
                      type="date"
                      value={formData.tanggal_mulai}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggal_mulai: e.target.value }))}
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
                    <Input
                      id="tanggal_selesai"
                      type="date"
                      value={formData.tanggal_selesai}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggal_selesai: e.target.value }))}
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pembimbing_sekolah">Pembimbing Sekolah</Label>
                    <Input
                      id="pembimbing_sekolah"
                      value={formData.pembimbing_sekolah}
                      onChange={(e) => setFormData(prev => ({ ...prev, pembimbing_sekolah: e.target.value }))}
                      placeholder="Nama guru pembimbing"
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pembimbing_industri">Pembimbing Industri</Label>
                    <Input
                      id="pembimbing_industri"
                      value={formData.pembimbing_industri}
                      onChange={(e) => setFormData(prev => ({ ...prev, pembimbing_industri: e.target.value }))}
                      placeholder="Nama pembimbing di industri"
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nilai_akhir">Nilai Akhir</Label>
                    <Input
                      id="nilai_akhir"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_akhir}
                      onChange={(e) => setFormData(prev => ({ ...prev, nilai_akhir: e.target.value }))}
                      placeholder="0-100"
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="keterangan">Keterangan</Label>
                    <Input
                      id="keterangan"
                      value={formData.keterangan}
                      onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                      placeholder="Keterangan tambahan"
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                  <Button type="submit" className="glow-effect">
                    {editingPrakerin ? 'Simpan' : 'Tambah'}
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
            <Briefcase className="mr-2 h-5 w-5 text-primary" />
            Daftar Data Prakerin
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : prakerin.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data prakerin
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead>Tempat Prakerin</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Nilai</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prakerin.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.nis}</TableCell>
                      <TableCell className="font-medium">{item.nama_siswa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.jurusan}</Badge>
                      </TableCell>
                      <TableCell>{item.tempat_prakerin || '-'}</TableCell>
                      <TableCell>
                        {item.tanggal_mulai && item.tanggal_selesai 
                          ? `${formatDate(item.tanggal_mulai)} s/d ${formatDate(item.tanggal_selesai)}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {item.nilai_akhir ? (
                          <Badge 
                            variant={item.nilai_akhir >= 75 ? "default" : "destructive"}
                          >
                            {item.nilai_akhir}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      {canEdit && (
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

export default PrakerinContent;