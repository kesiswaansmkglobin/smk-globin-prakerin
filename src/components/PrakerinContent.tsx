import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Briefcase, Users } from 'lucide-react';
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
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<SiswaData[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);
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
    setSelectedSiswaIds([]);
    setFormData(prev => ({ ...prev, siswa_id: '' }));
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

      // Guru pembimbing is general - no jurusan filter
      const guruQuery = supabase
        .from('guru_pembimbing')
        .select('id, nama, nip, jurusan_id, jurusan(nama)')
        .order('nama');

      // Filter kelas and siswa by user's jurusan if kaprog
      if (user?.role === 'kaprog' && userJurusanId) {
        kelasQuery = kelasQuery.eq('jurusan_id', userJurusanId);
        siswaQuery = siswaQuery.eq('jurusan_id', userJurusanId);
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

  const handleSiswaSelect = (siswaId: string, checked: boolean) => {
    if (isBatchMode) {
      setSelectedSiswaIds(prev => 
        checked 
          ? [...prev, siswaId] 
          : prev.filter(id => id !== siswaId)
      );
    } else {
      setSelectedSiswaIds(checked ? [siswaId] : []);
      setFormData(prev => ({ ...prev, siswa_id: checked ? siswaId : '' }));
    }
  };

  const handleSelectAllSiswa = (checked: boolean) => {
    if (checked) {
      setSelectedSiswaIds(filteredSiswa.map(s => s.id));
    } else {
      setSelectedSiswaIds([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // For batch mode, insert multiple records
      if (isBatchMode && selectedSiswaIds.length > 0) {
        const dataToInsert = selectedSiswaIds.map(siswaId => ({
          siswa_id: siswaId,
          tempat_prakerin: formData.tempat_prakerin,
          alamat_prakerin: formData.alamat_prakerin,
          tanggal_mulai: formData.tanggal_mulai,
          tanggal_selesai: formData.tanggal_selesai,
          guru_pembimbing_id: formData.guru_pembimbing_id || null,
          pembimbing_industri: formData.pembimbing_industri,
          status: formData.status,
          keterangan: formData.keterangan
        }));

        const { error } = await supabase
          .from('prakerin')
          .insert(dataToInsert);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: `${selectedSiswaIds.length} data prakerin berhasil ditambahkan`
        });
      } else {
        // Single mode - existing logic
        const data = {
          siswa_id: selectedSiswaIds[0] || formData.siswa_id,
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
    setIsBatchMode(false);
    
    // Find the siswa data
    const siswaData = siswaList.find(s => s.id === item.siswa_id);
    if (siswaData?.kelas?.nama) {
      setSelectedKelas(siswaData.kelas.nama);
    }
    setSelectedSiswaIds([item.siswa_id]);
    
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
    setSelectedSiswaIds([]);
    setEditingPrakerin(null);
    setIsBatchMode(false);
    setDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const canEdit = canEditPrakerin(user);

  const getSelectedSiswaData = (id?: string) => {
    const targetId = id || (selectedSiswaIds.length > 0 ? selectedSiswaIds[0] : undefined);
    return siswaList.find(s => s.id === targetId);
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

                  {/* Batch Mode Toggle - only for new entries */}
                  {!editingPrakerin && selectedKelas && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <Checkbox
                        id="batch-mode"
                        checked={isBatchMode}
                        onCheckedChange={(checked) => {
                          setIsBatchMode(!!checked);
                          setSelectedSiswaIds([]);
                        }}
                      />
                      <Label htmlFor="batch-mode" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        Tambah beberapa siswa sekaligus (Mode Batch)
                      </Label>
                    </div>
                  )}

                  {/* Siswa Selection - Single Mode */}
                  {!isBatchMode && (
                    <div className="space-y-2">
                      <Label htmlFor="siswa">Pilih Siswa</Label>
                      <Select 
                        value={selectedSiswaIds[0] || ''} 
                        onValueChange={(value) => handleSiswaSelect(value, true)}
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
                  )}

                  {/* Siswa Selection - Batch Mode (Multi-select with checkboxes) */}
                  {isBatchMode && selectedKelas && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Pilih Siswa ({selectedSiswaIds.length} dipilih)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAllSiswa(selectedSiswaIds.length !== filteredSiswa.length)}
                        >
                          {selectedSiswaIds.length === filteredSiswa.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                        </Button>
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-border/50 rounded-lg p-2 space-y-1 bg-input/30">
                        {filteredSiswa.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-2">Tidak ada siswa di kelas ini</p>
                        ) : (
                          filteredSiswa.map((siswa) => (
                            <div
                              key={siswa.id}
                              className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/50 transition-colors"
                            >
                              <Checkbox
                                id={`siswa-${siswa.id}`}
                                checked={selectedSiswaIds.includes(siswa.id)}
                                onCheckedChange={(checked) => handleSiswaSelect(siswa.id, !!checked)}
                              />
                              <Label htmlFor={`siswa-${siswa.id}`} className="flex-1 cursor-pointer text-sm">
                                {siswa.nama} <span className="text-muted-foreground">({siswa.nis})</span>
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Display Selected Siswa Info - Single mode only */}
                  {!isBatchMode && selectedSiswaIds.length > 0 && (
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

                  {/* Display Selected Siswa Info - Batch mode */}
                  {isBatchMode && selectedSiswaIds.length > 0 && (
                    <Card className="bg-primary/10 border-primary/20">
                      <CardContent className="pt-4">
                        <p className="text-sm font-medium mb-2">{selectedSiswaIds.length} siswa terpilih:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedSiswaIds.slice(0, 5).map(id => {
                            const siswa = getSelectedSiswaData(id);
                            return siswa ? (
                              <Badge key={id} variant="secondary" className="text-xs">
                                {siswa.nama}
                              </Badge>
                            ) : null;
                          })}
                          {selectedSiswaIds.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedSiswaIds.length - 5} lainnya
                            </Badge>
                          )}
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
                    <Button 
                      type="submit" 
                      className="glow-effect" 
                      disabled={selectedSiswaIds.length === 0}
                    >
                      {editingPrakerin ? 'Simpan' : isBatchMode ? `Tambah ${selectedSiswaIds.length} Siswa` : 'Tambah'}
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
