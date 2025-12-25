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
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

import { canEditPrakerin } from '@/utils/permissions';

interface PrakerinContentProps {
  user: any;
}

interface SiswaData {
  id: string;
  nis: string;
  nama: string;
  kelas: { nama: string } | null;
  jurusan: { nama: string } | null;
}

interface KelasData {
  id: string;
  nama: string;
  jurusan: { nama: string } | null;
}

interface GuruPembimbingData {
  id: string;
  nama: string;
  nip: string | null;
  jurusan: { nama: string } | null;
}

const PrakerinContent = ({ user }: PrakerinContentProps) => {
  const [prakerin, setPrakerin] = useState<any[]>([]);
  const [siswaList, setSiswaList] = useState<SiswaData[]>([]);
  const [kelasList, setKelasList] = useState<KelasData[]>([]);
  const [guruPembimbingList, setGuruPembimbingList] = useState<GuruPembimbingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrakerin, setEditingPrakerin] = useState<any>(null);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedSiswa, setSelectedSiswa] = useState('');
  const [filteredSiswa, setFilteredSiswa] = useState<SiswaData[]>([]);
  const [formData, setFormData] = useState({
    siswa_id: '',
    tempat_prakerin: '',
    alamat_prakerin: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    guru_pembimbing_id: '',
    pembimbing_industri: '',
    status: 'aktif',
    keterangan: ''
  });
  const { toast } = useToast();

  // Realtime subscription for prakerin updates
  useRealtimeSubscription({
    table: 'prakerin',
    onInsert: () => loadData(),
    onUpdate: () => loadData(),
    onDelete: () => loadData(),
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedKelas) {
      const filtered = siswaList.filter(siswa => 
        siswa.kelas?.nama === selectedKelas
      );
      setFilteredSiswa(filtered);
    } else {
      setFilteredSiswa([]);
    }
    setSelectedSiswa('');
  }, [selectedKelas, siswaList]);

  const loadData = async () => {
    try {
      // Get user's jurusan_id first if kaprog
      let userJurusanId: string | null = null;
      if (user?.role === 'kaprog') {
        const { data: jurusanData } = await supabase
          .from('jurusan')
          .select('id')
          .eq('nama', user.jurusan)
          .single();
        userJurusanId = jurusanData?.id || null;
      }

      let prakerinQuery = supabase
        .from('prakerin')
        .select(`
          *,
          siswa!inner(
            nis,
            nama,
            jurusan_id,
            kelas!inner(nama),
            jurusan!inner(nama)
          ),
          guru_pembimbing(
            id,
            nama,
            nip
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by user's jurusan if kaprog
      if (user?.role === 'kaprog' && userJurusanId) {
        prakerinQuery = prakerinQuery.eq('siswa.jurusan_id', userJurusanId);
      }

      let kelasQuery = supabase
        .from('kelas')
        .select('id, nama, jurusan_id, jurusan(nama)')
        .order('nama');

      let siswaQuery = supabase
        .from('siswa')
        .select('id, nis, nama, jurusan_id, kelas(nama), jurusan(nama)')
        .order('nama');

      let guruQuery = supabase
        .from('guru_pembimbing')
        .select('id, nama, nip, jurusan_id, jurusan(nama)')
        .order('nama');

      // Filter by user's jurusan if kaprog
      if (user?.role === 'kaprog' && userJurusanId) {
        kelasQuery = kelasQuery.eq('jurusan_id', userJurusanId);
        siswaQuery = siswaQuery.eq('jurusan_id', userJurusanId);
        guruQuery = guruQuery.eq('jurusan_id', userJurusanId);
      }

      const [prakerinRes, kelasRes, siswaRes, guruRes] = await Promise.all([
        prakerinQuery,
        kelasQuery,
        siswaQuery,
        guruQuery
      ]);

      if (prakerinRes.error) throw prakerinRes.error;
      if (kelasRes.error) throw kelasRes.error;
      if (siswaRes.error) throw siswaRes.error;
      if (guruRes.error) throw guruRes.error;

      setPrakerin(prakerinRes.data || []);
      setKelasList(kelasRes.data || []);
      setSiswaList(siswaRes.data || []);
      setGuruPembimbingList(guruRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSiswaSelect = (siswaId: string) => {
    const selectedSiswaData = siswaList.find(s => s.id === siswaId);
    if (selectedSiswaData) {
      setSelectedSiswa(siswaId);
      setFormData(prev => ({
        ...prev,
        siswa_id: siswaId
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        siswa_id: formData.siswa_id,
        tempat_prakerin: formData.tempat_prakerin,
        alamat_prakerin: formData.alamat_prakerin,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai,
        guru_pembimbing_id: formData.guru_pembimbing_id || null,
        pembimbing_industri: formData.pembimbing_industri,
        status: formData.status,
        keterangan: formData.keterangan
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingPrakerin(item);
    
    // Find the siswa data
    const siswaData = siswaList.find(s => s.id === item.siswa_id);
    if (siswaData?.kelas?.nama) {
      setSelectedKelas(siswaData.kelas.nama);
    }
    setSelectedSiswa(item.siswa_id);
    
    setFormData({
      siswa_id: item.siswa_id || '',
      tempat_prakerin: item.tempat_prakerin || '',
      alamat_prakerin: item.alamat_prakerin || '',
      tanggal_mulai: item.tanggal_mulai || '',
      tanggal_selesai: item.tanggal_selesai || '',
      guru_pembimbing_id: item.guru_pembimbing_id || '',
      pembimbing_industri: item.pembimbing_industri || '',
      status: item.status || 'aktif',
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus data prakerin",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      siswa_id: '',
      tempat_prakerin: '',
      alamat_prakerin: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      guru_pembimbing_id: '',
      pembimbing_industri: '',
      status: 'aktif',
      keterangan: ''
    });
    setSelectedKelas('');
    setSelectedSiswa('');
    setEditingPrakerin(null);
    setDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const canEdit = canEditPrakerin(user);

  const getSelectedSiswaData = () => {
    return siswaList.find(s => s.id === selectedSiswa);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Aktif</Badge>;
      case 'selesai':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Selesai</Badge>;
      case 'batal':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Batal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Data Prakerin</h1>
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
            <DialogContent className="dialog-surface border-border/50 max-w-2xl overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {editingPrakerin ? 'Edit Data Prakerin' : 'Tambah Data Prakerin'}
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Kelas Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="kelas">Pilih Kelas</Label>
                    <Select 
                      value={selectedKelas} 
                      onValueChange={setSelectedKelas}
                    >
                      <SelectTrigger className="bg-input/50 border-border/50">
                        <SelectValue placeholder="Pilih kelas terlebih dahulu" />
                      </SelectTrigger>
                      <SelectContent className="card-gradient border-border/50">
                        {kelasList.map((kelas) => (
                          <SelectItem key={kelas.id} value={kelas.nama}>
                            {kelas.nama} - {kelas.jurusan?.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Siswa Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="siswa">Pilih Siswa</Label>
                    <Select 
                      value={selectedSiswa} 
                      onValueChange={handleSiswaSelect}
                      disabled={!selectedKelas}
                    >
                      <SelectTrigger className="bg-input/50 border-border/50">
                        <SelectValue placeholder={selectedKelas ? "Pilih siswa" : "Pilih kelas terlebih dahulu"} />
                      </SelectTrigger>
                      <SelectContent className="card-gradient border-border/50">
                        {filteredSiswa.map((siswa) => (
                          <SelectItem key={siswa.id} value={siswa.id}>
                            {siswa.nama} - {siswa.nis}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Display Selected Siswa Info */}
                  {selectedSiswa && (
                    <Card className="bg-primary/10 border-primary/20">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-muted-foreground">NIS:</Label>
                            <p className="font-medium">{getSelectedSiswaData()?.nis}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Nama:</Label>
                            <p className="font-medium">{getSelectedSiswaData()?.nama}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Kelas:</Label>
                            <p className="font-medium">{getSelectedSiswaData()?.kelas?.nama}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Jurusan:</Label>
                            <p className="font-medium">{getSelectedSiswaData()?.jurusan?.nama}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="tempat_prakerin">Tempat Prakerin</Label>
                    <Input
                      id="tempat_prakerin"
                      value={formData.tempat_prakerin}
                      onChange={(e) => setFormData(prev => ({ ...prev, tempat_prakerin: e.target.value }))}
                      placeholder="PT. ABC / CV. XYZ"
                      className="bg-input/50 border-border/50"
                      required
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
                      required
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
                        required
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
                        required
                      />
                    </div>
                  </div>

                  {/* Guru Pembimbing Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="guru_pembimbing">Guru Pembimbing</Label>
                    <Select 
                      value={formData.guru_pembimbing_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, guru_pembimbing_id: value }))}
                    >
                      <SelectTrigger className="bg-input/50 border-border/50">
                        <SelectValue placeholder="Pilih guru pembimbing" />
                      </SelectTrigger>
                      <SelectContent className="card-gradient border-border/50">
                        {guruPembimbingList.map((guru) => (
                          <SelectItem key={guru.id} value={guru.id}>
                            {guru.nama} {guru.nip ? `- ${guru.nip}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {guruPembimbingList.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Belum ada guru pembimbing. Tambahkan melalui menu Guru Pembimbing.
                      </p>
                    )}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          <SelectItem value="aktif">Aktif</SelectItem>
                          <SelectItem value="selesai">Selesai</SelectItem>
                          <SelectItem value="batal">Batal</SelectItem>
                        </SelectContent>
                      </Select>
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
                  
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                    <Button type="submit" className="glow-effect" disabled={!selectedSiswa}>
                      {editingPrakerin ? 'Simpan' : 'Tambah'}
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
                    <TableHead>Kelas</TableHead>
                    <TableHead>Tempat Prakerin</TableHead>
                    <TableHead>Guru Pembimbing</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prakerin.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.siswa?.nis}</TableCell>
                      <TableCell className="font-medium">{item.siswa?.nama}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.siswa?.kelas?.nama}</Badge>
                      </TableCell>
                      <TableCell>{item.tempat_prakerin || '-'}</TableCell>
                      <TableCell>{item.guru_pembimbing?.nama || '-'}</TableCell>
                      <TableCell>
                        {item.tanggal_mulai && item.tanggal_selesai 
                          ? `${formatDate(item.tanggal_mulai)} s/d ${formatDate(item.tanggal_selesai)}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status || 'aktif')}
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
