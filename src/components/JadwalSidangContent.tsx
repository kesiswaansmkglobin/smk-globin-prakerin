import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Calendar, Users, Award, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface JadwalSidangContentProps {
  user: any;
}

interface JadwalSidang {
  id: string;
  jurusan_id: string;
  nama: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan: string | null;
  jurusan?: { nama: string } | null;
}

interface PesertaSidang {
  id: string;
  jadwal_sidang_id: string;
  siswa_id: string;
  prakerin_id: string | null;
  urutan: number;
  nilai_sidang: number | null;
  catatan: string | null;
  siswa?: { nama: string; nis: string } | null;
  jadwal_sidang?: { nama: string; tanggal: string } | null;
}

interface PengujiSidang {
  id: string;
  jadwal_sidang_id: string;
  guru_pembimbing_id: string;
  peran: string;
  guru_pembimbing?: { nama: string } | null;
  jadwal_sidang?: { nama: string } | null;
}

interface Siswa {
  id: string;
  nama: string;
  nis: string;
}

interface GuruPembimbing {
  id: string;
  nama: string;
}

interface Jurusan {
  id: string;
  nama: string;
}

const JadwalSidangContent = ({ user }: JadwalSidangContentProps) => {
  const [jadwalList, setJadwalList] = useState<JadwalSidang[]>([]);
  const [pesertaList, setPesertaList] = useState<PesertaSidang[]>([]);
  const [pengujiList, setPengujiList] = useState<PengujiSidang[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [guruList, setGuruList] = useState<GuruPembimbing[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [jadwalDialogOpen, setJadwalDialogOpen] = useState(false);
  const [pesertaDialogOpen, setPesertaDialogOpen] = useState(false);
  const [pengujiDialogOpen, setPengujiDialogOpen] = useState(false);
  
  const [editingJadwal, setEditingJadwal] = useState<JadwalSidang | null>(null);
  const [editingPeserta, setEditingPeserta] = useState<PesertaSidang | null>(null);
  const [editingPenguji, setEditingPenguji] = useState<PengujiSidang | null>(null);
  
  const [activeTab, setActiveTab] = useState('jadwal');

  const [jadwalFormData, setJadwalFormData] = useState({
    nama: '',
    tanggal: '',
    waktu_mulai: '',
    waktu_selesai: '',
    ruangan: '',
    jurusan_id: ''
  });

  const [pesertaFormData, setPesertaFormData] = useState({
    jadwal_sidang_id: '',
    siswa_id: '',
    urutan: '1',
    nilai_sidang: '',
    catatan: ''
  });

  const [pengujiFormData, setPengujiFormData] = useState({
    jadwal_sidang_id: '',
    guru_pembimbing_id: '',
    peran: 'penguji'
  });

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      let userJurusanId: string | null = null;
      if (user?.role === 'kaprog') {
        const { data: jurusanData } = await supabase
          .from('jurusan')
          .select('id')
          .eq('nama', user.jurusan)
          .single();
        userJurusanId = jurusanData?.id || null;
      }

      // Load jadwal sidang
      let jadwalQuery = supabase
        .from('jadwal_sidang')
        .select('*, jurusan(nama)')
        .order('tanggal', { ascending: false });

      if (userJurusanId) {
        jadwalQuery = jadwalQuery.eq('jurusan_id', userJurusanId);
      }

      // Load peserta sidang
      const pesertaQuery = supabase
        .from('peserta_sidang')
        .select(`
          *,
          siswa(nama, nis),
          jadwal_sidang(nama, tanggal)
        `)
        .order('urutan');

      // Load penguji sidang
      const pengujiQuery = supabase
        .from('penguji_sidang')
        .select(`
          *,
          guru_pembimbing(nama),
          jadwal_sidang(nama)
        `)
        .order('created_at');

      // Load siswa for dropdown
      let siswaQuery = supabase
        .from('siswa')
        .select('id, nama, nis, jurusan_id')
        .order('nama');

      if (userJurusanId) {
        siswaQuery = siswaQuery.eq('jurusan_id', userJurusanId);
      }

      // Load guru for dropdown - no filter since they're general
      let guruQuery = supabase
        .from('guru_pembimbing')
        .select('id, nama')
        .order('nama');

      // Load jurusan list for admin
      const jurusanQuery = supabase
        .from('jurusan')
        .select('id, nama')
        .order('nama');

      const [jadwalRes, pesertaRes, pengujiRes, siswaRes, guruRes, jurusanRes] = await Promise.all([
        jadwalQuery,
        pesertaQuery,
        pengujiQuery,
        siswaQuery,
        guruQuery,
        jurusanQuery
      ]);

      if (jadwalRes.error) throw jadwalRes.error;
      if (pesertaRes.error) throw pesertaRes.error;
      if (pengujiRes.error) throw pengujiRes.error;
      if (siswaRes.error) throw siswaRes.error;
      if (guruRes.error) throw guruRes.error;
      if (jurusanRes.error) throw jurusanRes.error;

      setJadwalList(jadwalRes.data || []);
      setPesertaList(pesertaRes.data || []);
      setPengujiList(pengujiRes.data || []);
      setSiswaList(siswaRes.data || []);
      setGuruList(guruRes.data || []);
      setJurusanList(jurusanRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useRealtimeSubscription({
    table: 'peserta_sidang',
    onInsert: loadData,
    onUpdate: loadData,
    onDelete: loadData,
    showToast: true
  });

  const handleSubmitJadwal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let jurusanId: string | null = null;
      
      if (user?.role === 'admin') {
        jurusanId = jadwalFormData.jurusan_id || null;
      } else {
        const { data: jurusanData } = await supabase
          .from('jurusan')
          .select('id')
          .eq('nama', user.jurusan)
          .single();
        jurusanId = jurusanData?.id || null;
      }

      if (!jurusanId) {
        toast({ title: "Error", description: "Silakan pilih jurusan", variant: "destructive" });
        return;
      }

      const data = {
        nama: jadwalFormData.nama,
        tanggal: jadwalFormData.tanggal,
        waktu_mulai: jadwalFormData.waktu_mulai,
        waktu_selesai: jadwalFormData.waktu_selesai,
        ruangan: jadwalFormData.ruangan || null,
        jurusan_id: jurusanId
      };

      if (editingJadwal) {
        const { error } = await supabase
          .from('jadwal_sidang')
          .update(data)
          .eq('id', editingJadwal.id);

        if (error) throw error;

        toast({ title: "Berhasil", description: "Jadwal berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from('jadwal_sidang')
          .insert([data]);

        if (error) throw error;

        toast({ title: "Berhasil", description: "Jadwal berhasil ditambahkan" });
      }

      setJadwalDialogOpen(false);
      resetJadwalForm();
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmitPeserta = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        jadwal_sidang_id: pesertaFormData.jadwal_sidang_id,
        siswa_id: pesertaFormData.siswa_id,
        urutan: parseInt(pesertaFormData.urutan),
        nilai_sidang: pesertaFormData.nilai_sidang ? parseFloat(pesertaFormData.nilai_sidang) : null,
        catatan: pesertaFormData.catatan || null
      };

      if (editingPeserta) {
        const { error } = await supabase
          .from('peserta_sidang')
          .update(data)
          .eq('id', editingPeserta.id);

        if (error) throw error;

        toast({ title: "Berhasil", description: "Peserta berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from('peserta_sidang')
          .insert([data]);

        if (error) throw error;

        toast({ title: "Berhasil", description: "Peserta berhasil ditambahkan" });
      }

      setPesertaDialogOpen(false);
      resetPesertaForm();
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmitPenguji = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        jadwal_sidang_id: pengujiFormData.jadwal_sidang_id,
        guru_pembimbing_id: pengujiFormData.guru_pembimbing_id,
        peran: pengujiFormData.peran
      };

      if (editingPenguji) {
        const { error } = await supabase
          .from('penguji_sidang')
          .update(data)
          .eq('id', editingPenguji.id);

        if (error) throw error;

        toast({ title: "Berhasil", description: "Penguji berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from('penguji_sidang')
          .insert([data]);

        if (error) throw error;

        toast({ title: "Berhasil", description: "Penguji berhasil ditambahkan" });
      }

      setPengujiDialogOpen(false);
      resetPengujiForm();
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditJadwal = (jadwal: JadwalSidang) => {
    setEditingJadwal(jadwal);
    setJadwalFormData({
      nama: jadwal.nama,
      tanggal: jadwal.tanggal,
      waktu_mulai: jadwal.waktu_mulai,
      waktu_selesai: jadwal.waktu_selesai,
      ruangan: jadwal.ruangan || '',
      jurusan_id: jadwal.jurusan_id || ''
    });
    setJadwalDialogOpen(true);
  };

  const handleEditPeserta = (peserta: PesertaSidang) => {
    setEditingPeserta(peserta);
    setPesertaFormData({
      jadwal_sidang_id: peserta.jadwal_sidang_id,
      siswa_id: peserta.siswa_id,
      urutan: peserta.urutan.toString(),
      nilai_sidang: peserta.nilai_sidang?.toString() || '',
      catatan: peserta.catatan || ''
    });
    setPesertaDialogOpen(true);
  };

  const handleEditPenguji = (penguji: PengujiSidang) => {
    setEditingPenguji(penguji);
    setPengujiFormData({
      jadwal_sidang_id: penguji.jadwal_sidang_id,
      guru_pembimbing_id: penguji.guru_pembimbing_id,
      peran: penguji.peran
    });
    setPengujiDialogOpen(true);
  };

  const handleDelete = async (tableName: 'jadwal_sidang' | 'peserta_sidang' | 'penguji_sidang', id: string) => {
    if (!confirm('Hapus data ini?')) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Data berhasil dihapus" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: "Gagal menghapus", variant: "destructive" });
    }
  };

  const resetJadwalForm = () => {
    setJadwalFormData({ nama: '', tanggal: '', waktu_mulai: '', waktu_selesai: '', ruangan: '', jurusan_id: '' });
    setEditingJadwal(null);
  };

  const resetPesertaForm = () => {
    setPesertaFormData({ jadwal_sidang_id: '', siswa_id: '', urutan: '1', nilai_sidang: '', catatan: '' });
    setEditingPeserta(null);
  };

  const resetPengujiForm = () => {
    setPengujiFormData({ jadwal_sidang_id: '', guru_pembimbing_id: '', peran: 'penguji' });
    setEditingPenguji(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPeranBadge = (peran: string) => {
    switch (peran) {
      case 'ketua':
        return <Badge className="bg-blue-600">Ketua</Badge>;
      case 'sekretaris':
        return <Badge className="bg-green-600">Sekretaris</Badge>;
      default:
        return <Badge variant="outline">Penguji</Badge>;
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'kaprog';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Jadwal Sidang</h1>
          <p className="text-muted-foreground">Kelola jadwal sidang prakerin</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jadwal" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Jadwal
          </TabsTrigger>
          <TabsTrigger value="peserta" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Peserta
          </TabsTrigger>
          <TabsTrigger value="penguji" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Penguji
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jadwal" className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <Dialog open={jadwalDialogOpen} onOpenChange={setJadwalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetJadwalForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Jadwal
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingJadwal ? 'Edit Jadwal' : 'Buat Jadwal Sidang'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitJadwal} className="space-y-4">
                    {/* Jurusan selector for admin */}
                    {user?.role === 'admin' && (
                      <div className="space-y-2">
                        <Label>Jurusan *</Label>
                        <Select
                          value={jadwalFormData.jurusan_id}
                          onValueChange={(value) => setJadwalFormData(prev => ({ ...prev, jurusan_id: value }))}
                        >
                          <SelectTrigger className="bg-input/50 border-border/50">
                            <SelectValue placeholder="Pilih jurusan" />
                          </SelectTrigger>
                          <SelectContent className="card-gradient border-border/50">
                            {jurusanList.map((j) => (
                              <SelectItem key={j.id} value={j.id}>
                                {j.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Nama Sidang *</Label>
                      <Input
                        value={jadwalFormData.nama}
                        onChange={(e) => setJadwalFormData(prev => ({ ...prev, nama: e.target.value }))}
                        placeholder="Contoh: Sidang Prakerin Gelombang 1"
                        className="bg-input/50 border-border/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tanggal *</Label>
                      <Input
                        type="date"
                        value={jadwalFormData.tanggal}
                        onChange={(e) => setJadwalFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                        className="bg-input/50 border-border/50"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Waktu Mulai *</Label>
                        <Input
                          type="time"
                          value={jadwalFormData.waktu_mulai}
                          onChange={(e) => setJadwalFormData(prev => ({ ...prev, waktu_mulai: e.target.value }))}
                          className="bg-input/50 border-border/50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Waktu Selesai *</Label>
                        <Input
                          type="time"
                          value={jadwalFormData.waktu_selesai}
                          onChange={(e) => setJadwalFormData(prev => ({ ...prev, waktu_selesai: e.target.value }))}
                          className="bg-input/50 border-border/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Ruangan</Label>
                      <Input
                        value={jadwalFormData.ruangan}
                        onChange={(e) => setJadwalFormData(prev => ({ ...prev, ruangan: e.target.value }))}
                        placeholder="Contoh: Ruang Sidang Lt. 2"
                        className="bg-input/50 border-border/50"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setJadwalDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="glow-effect">
                        {editingJadwal ? 'Simpan' : 'Buat'}
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
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Daftar Jadwal Sidang
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : jadwalList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Belum ada jadwal sidang</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama Sidang</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Ruangan</TableHead>
                        <TableHead>Jurusan</TableHead>
                        {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jadwalList.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell>{formatDate(item.tanggal)}</TableCell>
                          <TableCell>{item.waktu_mulai} - {item.waktu_selesai}</TableCell>
                          <TableCell>{item.ruangan || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.jurusan?.nama}</Badge>
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditJadwal(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete('jadwal_sidang', item.id)}
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
        </TabsContent>

        <TabsContent value="peserta" className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <Dialog open={pesertaDialogOpen} onOpenChange={setPesertaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetPesertaForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Peserta
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPeserta ? 'Edit Peserta' : 'Tambah Peserta Sidang'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitPeserta} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Jadwal Sidang *</Label>
                      <Select
                        value={pesertaFormData.jadwal_sidang_id}
                        onValueChange={(value) => setPesertaFormData(prev => ({ ...prev, jadwal_sidang_id: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih jadwal" />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          {jadwalList.map((j) => (
                            <SelectItem key={j.id} value={j.id}>
                              {j.nama} - {formatDate(j.tanggal)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Siswa *</Label>
                      <Select
                        value={pesertaFormData.siswa_id}
                        onValueChange={(value) => setPesertaFormData(prev => ({ ...prev, siswa_id: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih siswa" />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          {siswaList.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nama} - {s.nis}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Urutan</Label>
                      <Input
                        type="number"
                        min="1"
                        value={pesertaFormData.urutan}
                        onChange={(e) => setPesertaFormData(prev => ({ ...prev, urutan: e.target.value }))}
                        className="bg-input/50 border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nilai Sidang (0-100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={pesertaFormData.nilai_sidang}
                        onChange={(e) => setPesertaFormData(prev => ({ ...prev, nilai_sidang: e.target.value }))}
                        className="bg-input/50 border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Catatan</Label>
                      <Textarea
                        value={pesertaFormData.catatan}
                        onChange={(e) => setPesertaFormData(prev => ({ ...prev, catatan: e.target.value }))}
                        className="bg-input/50 border-border/50"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setPesertaDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="glow-effect">
                        {editingPeserta ? 'Simpan' : 'Tambah'}
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
                <Users className="mr-2 h-5 w-5 text-primary" />
                Daftar Peserta Sidang
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : pesertaList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Belum ada peserta</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Urutan</TableHead>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Jadwal</TableHead>
                        <TableHead>Nilai Sidang</TableHead>
                        <TableHead>Catatan</TableHead>
                        {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pesertaList.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant="outline">{item.urutan}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.siswa?.nama || '-'}
                          </TableCell>
                          <TableCell>{item.jadwal_sidang?.nama || '-'}</TableCell>
                          <TableCell>
                            {item.nilai_sidang !== null ? (
                              <Badge className={item.nilai_sidang >= 75 ? 'bg-green-600' : 'bg-yellow-600'}>
                                {item.nilai_sidang.toFixed(2)}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {item.catatan || '-'}
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditPeserta(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete('peserta_sidang', item.id)}
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
        </TabsContent>

        <TabsContent value="penguji" className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <Dialog open={pengujiDialogOpen} onOpenChange={setPengujiDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetPengujiForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Penguji
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPenguji ? 'Edit Penguji' : 'Tambah Penguji Sidang'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitPenguji} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Jadwal Sidang *</Label>
                      <Select
                        value={pengujiFormData.jadwal_sidang_id}
                        onValueChange={(value) => setPengujiFormData(prev => ({ ...prev, jadwal_sidang_id: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih jadwal" />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          {jadwalList.map((j) => (
                            <SelectItem key={j.id} value={j.id}>
                              {j.nama} - {formatDate(j.tanggal)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Guru Pembimbing *</Label>
                      <Select
                        value={pengujiFormData.guru_pembimbing_id}
                        onValueChange={(value) => setPengujiFormData(prev => ({ ...prev, guru_pembimbing_id: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih guru" />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          {guruList.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Peran</Label>
                      <Select
                        value={pengujiFormData.peran}
                        onValueChange={(value) => setPengujiFormData(prev => ({ ...prev, peran: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          <SelectItem value="penguji">Penguji</SelectItem>
                          <SelectItem value="ketua">Ketua</SelectItem>
                          <SelectItem value="sekretaris">Sekretaris</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setPengujiDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="glow-effect">
                        {editingPenguji ? 'Simpan' : 'Tambah'}
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
                <UserCheck className="mr-2 h-5 w-5 text-primary" />
                Daftar Penguji Sidang
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : pengujiList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Belum ada penguji</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama Guru</TableHead>
                        <TableHead>Jadwal</TableHead>
                        <TableHead>Peran</TableHead>
                        {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pengujiList.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {item.guru_pembimbing?.nama || '-'}
                          </TableCell>
                          <TableCell>{item.jadwal_sidang?.nama || '-'}</TableCell>
                          <TableCell>{getPeranBadge(item.peran)}</TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditPenguji(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete('penguji_sidang', item.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JadwalSidangContent;
