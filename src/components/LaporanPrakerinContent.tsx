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
import { Plus, Edit, Trash2, FileText, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface LaporanPrakerinContentProps {
  user: any;
}

interface LaporanPrakerin {
  id: string;
  jurusan_id: string;
  judul: string;
  deskripsi: string | null;
  tenggat_waktu: string;
  jurusan?: { nama: string } | null;
}

interface PengumpulanLaporan {
  id: string;
  laporan_id: string;
  siswa_id: string;
  prakerin_id: string | null;
  tanggal_pengumpulan: string | null;
  nilai: number | null;
  status: string;
  catatan: string | null;
  siswa?: { nama: string; nis: string } | null;
  laporan_prakerin?: { judul: string; tenggat_waktu: string } | null;
}

interface Siswa {
  id: string;
  nama: string;
  nis: string;
}

interface Jurusan {
  id: string;
  nama: string;
}

const LaporanPrakerinContent = ({ user }: LaporanPrakerinContentProps) => {
  const [laporanList, setLaporanList] = useState<LaporanPrakerin[]>([]);
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanLaporan[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [loading, setLoading] = useState(true);
  const [laporanDialogOpen, setLaporanDialogOpen] = useState(false);
  const [pengumpulanDialogOpen, setPengumpulanDialogOpen] = useState(false);
  const [editingLaporan, setEditingLaporan] = useState<LaporanPrakerin | null>(null);
  const [editingPengumpulan, setEditingPengumpulan] = useState<PengumpulanLaporan | null>(null);
  const [selectedLaporan, setSelectedLaporan] = useState<string>('');
  const [activeTab, setActiveTab] = useState('laporan');

  const [laporanFormData, setLaporanFormData] = useState({
    judul: '',
    deskripsi: '',
    tenggat_waktu: '',
    jurusan_id: ''
  });

  const [pengumpulanFormData, setPengumpulanFormData] = useState({
    laporan_id: '',
    siswa_id: '',
    tanggal_pengumpulan: '',
    nilai: '',
    status: 'belum',
    catatan: ''
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

      // Load laporan prakerin
      let laporanQuery = supabase
        .from('laporan_prakerin')
        .select('*, jurusan(nama)')
        .order('tenggat_waktu', { ascending: false });

      if (userJurusanId) {
        laporanQuery = laporanQuery.eq('jurusan_id', userJurusanId);
      }

      // Load pengumpulan laporan
      const pengumpulanQuery = supabase
        .from('pengumpulan_laporan')
        .select(`
          *,
          siswa(nama, nis),
          laporan_prakerin(judul, tenggat_waktu)
        `)
        .order('created_at', { ascending: false });

      // Load siswa for dropdown
      let siswaQuery = supabase
        .from('siswa')
        .select('id, nama, nis, jurusan_id')
        .order('nama');

      if (userJurusanId) {
        siswaQuery = siswaQuery.eq('jurusan_id', userJurusanId);
      }

      // Load jurusan list for admin
      const jurusanQuery = supabase
        .from('jurusan')
        .select('id, nama')
        .order('nama');

      const [laporanRes, pengumpulanRes, siswaRes, jurusanRes] = await Promise.all([
        laporanQuery,
        pengumpulanQuery,
        siswaQuery,
        jurusanQuery
      ]);

      if (laporanRes.error) throw laporanRes.error;
      if (pengumpulanRes.error) throw pengumpulanRes.error;
      if (siswaRes.error) throw siswaRes.error;
      if (jurusanRes.error) throw jurusanRes.error;

      setLaporanList(laporanRes.data || []);
      setPengumpulanList(pengumpulanRes.data || []);
      setSiswaList(siswaRes.data || []);
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
    table: 'pengumpulan_laporan',
    onInsert: loadData,
    onUpdate: loadData,
    onDelete: loadData,
    showToast: true
  });

  const handleSubmitLaporan = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let jurusanId: string | null = null;
      
      // For admin, use selected jurusan_id from form
      if (user?.role === 'admin') {
        jurusanId = laporanFormData.jurusan_id || null;
      } else {
        // For kaprog, get their jurusan
        const { data: jurusanData } = await supabase
          .from('jurusan')
          .select('id')
          .eq('nama', user.jurusan)
          .single();
        jurusanId = jurusanData?.id || null;
      }

      if (!jurusanId) {
        toast({
          title: "Error",
          description: "Silakan pilih jurusan",
          variant: "destructive"
        });
        return;
      }

      const data = {
        judul: laporanFormData.judul,
        deskripsi: laporanFormData.deskripsi || null,
        tenggat_waktu: laporanFormData.tenggat_waktu,
        jurusan_id: jurusanId
      };

      if (editingLaporan) {
        const { error } = await supabase
          .from('laporan_prakerin')
          .update(data)
          .eq('id', editingLaporan.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Laporan berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('laporan_prakerin')
          .insert([data]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Laporan berhasil ditambahkan"
        });
      }

      setLaporanDialogOpen(false);
      resetLaporanForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleSubmitPengumpulan = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        laporan_id: pengumpulanFormData.laporan_id,
        siswa_id: pengumpulanFormData.siswa_id,
        tanggal_pengumpulan: pengumpulanFormData.tanggal_pengumpulan || null,
        nilai: pengumpulanFormData.nilai ? parseFloat(pengumpulanFormData.nilai) : null,
        status: pengumpulanFormData.status,
        catatan: pengumpulanFormData.catatan || null
      };

      if (editingPengumpulan) {
        const { error } = await supabase
          .from('pengumpulan_laporan')
          .update(data)
          .eq('id', editingPengumpulan.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Pengumpulan berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('pengumpulan_laporan')
          .insert([data]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Pengumpulan berhasil ditambahkan"
        });
      }

      setPengumpulanDialogOpen(false);
      resetPengumpulanForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleEditLaporan = (laporan: LaporanPrakerin) => {
    setEditingLaporan(laporan);
    setLaporanFormData({
      judul: laporan.judul,
      deskripsi: laporan.deskripsi || '',
      tenggat_waktu: laporan.tenggat_waktu.split('T')[0],
      jurusan_id: laporan.jurusan_id || ''
    });
    setLaporanDialogOpen(true);
  };

  const handleEditPengumpulan = (pengumpulan: PengumpulanLaporan) => {
    setEditingPengumpulan(pengumpulan);
    setPengumpulanFormData({
      laporan_id: pengumpulan.laporan_id,
      siswa_id: pengumpulan.siswa_id,
      tanggal_pengumpulan: pengumpulan.tanggal_pengumpulan?.split('T')[0] || '',
      nilai: pengumpulan.nilai?.toString() || '',
      status: pengumpulan.status,
      catatan: pengumpulan.catatan || ''
    });
    setPengumpulanDialogOpen(true);
  };

  const handleDeleteLaporan = async (id: string) => {
    if (!confirm('Hapus laporan ini?')) return;

    try {
      const { error } = await supabase
        .from('laporan_prakerin')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Laporan berhasil dihapus" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: "Gagal menghapus", variant: "destructive" });
    }
  };

  const handleDeletePengumpulan = async (id: string) => {
    if (!confirm('Hapus pengumpulan ini?')) return;

    try {
      const { error } = await supabase
        .from('pengumpulan_laporan')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Pengumpulan berhasil dihapus" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: "Gagal menghapus", variant: "destructive" });
    }
  };

  const resetLaporanForm = () => {
    setLaporanFormData({ judul: '', deskripsi: '', tenggat_waktu: '', jurusan_id: '' });
    setEditingLaporan(null);
  };

  const resetPengumpulanForm = () => {
    setPengumpulanFormData({
      laporan_id: '',
      siswa_id: '',
      tanggal_pengumpulan: '',
      nilai: '',
      status: 'belum',
      catatan: ''
    });
    setEditingPengumpulan(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'tepat_waktu':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Tepat Waktu</Badge>;
      case 'terlambat':
        return <Badge className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Terlambat</Badge>;
      default:
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Belum</Badge>;
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'kaprog';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Laporan Prakerin</h1>
          <p className="text-muted-foreground">Kelola pengumpulan laporan prakerin</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="laporan" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Daftar Laporan
          </TabsTrigger>
          <TabsTrigger value="pengumpulan" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pengumpulan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="laporan" className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <Dialog open={laporanDialogOpen} onOpenChange={setLaporanDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetLaporanForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Laporan
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLaporan ? 'Edit Laporan' : 'Buat Laporan Baru'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitLaporan} className="space-y-4">
                    {/* Jurusan selector for admin */}
                    {user?.role === 'admin' && (
                      <div className="space-y-2">
                        <Label>Jurusan *</Label>
                        <Select
                          value={laporanFormData.jurusan_id}
                          onValueChange={(value) => setLaporanFormData(prev => ({ ...prev, jurusan_id: value }))}
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
                      <Label>Judul Laporan *</Label>
                      <Input
                        value={laporanFormData.judul}
                        onChange={(e) => setLaporanFormData(prev => ({ ...prev, judul: e.target.value }))}
                        placeholder="Contoh: Laporan Akhir Prakerin"
                        className="bg-input/50 border-border/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Deskripsi</Label>
                      <Textarea
                        value={laporanFormData.deskripsi}
                        onChange={(e) => setLaporanFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                        placeholder="Deskripsi laporan..."
                        className="bg-input/50 border-border/50"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tenggat Waktu *</Label>
                      <Input
                        type="datetime-local"
                        value={laporanFormData.tenggat_waktu}
                        onChange={(e) => setLaporanFormData(prev => ({ ...prev, tenggat_waktu: e.target.value }))}
                        className="bg-input/50 border-border/50"
                        required
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setLaporanDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="glow-effect">
                        {editingLaporan ? 'Simpan' : 'Buat'}
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
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Daftar Laporan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : laporanList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Belum ada laporan</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead>Jurusan</TableHead>
                        <TableHead>Tenggat Waktu</TableHead>
                        <TableHead>Status</TableHead>
                        {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {laporanList.map((item, index) => {
                        const isOverdue = new Date(item.tenggat_waktu) < new Date();
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{item.judul}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.jurusan?.nama}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(item.tenggat_waktu)}</TableCell>
                            <TableCell>
                              {isOverdue ? (
                                <Badge variant="destructive">Lewat Tenggat</Badge>
                              ) : (
                                <Badge className="bg-green-600">Aktif</Badge>
                              )}
                            </TableCell>
                            {canEdit && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditLaporan(item)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteLaporan(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pengumpulan" className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <Dialog open={pengumpulanDialogOpen} onOpenChange={setPengumpulanDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetPengumpulanForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Pengumpulan
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPengumpulan ? 'Edit Pengumpulan' : 'Tambah Pengumpulan'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitPengumpulan} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Laporan *</Label>
                      <Select
                        value={pengumpulanFormData.laporan_id}
                        onValueChange={(value) => setPengumpulanFormData(prev => ({ ...prev, laporan_id: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih laporan" />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          {laporanList.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.judul}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Siswa *</Label>
                      <Select
                        value={pengumpulanFormData.siswa_id}
                        onValueChange={(value) => setPengumpulanFormData(prev => ({ ...prev, siswa_id: value }))}
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
                      <Label>Tanggal Pengumpulan</Label>
                      <Input
                        type="datetime-local"
                        value={pengumpulanFormData.tanggal_pengumpulan}
                        onChange={(e) => setPengumpulanFormData(prev => ({ ...prev, tanggal_pengumpulan: e.target.value }))}
                        className="bg-input/50 border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={pengumpulanFormData.status}
                        onValueChange={(value) => setPengumpulanFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          <SelectItem value="belum">Belum Mengumpulkan</SelectItem>
                          <SelectItem value="tepat_waktu">Tepat Waktu</SelectItem>
                          <SelectItem value="terlambat">Terlambat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nilai (0-100)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={pengumpulanFormData.nilai}
                        onChange={(e) => setPengumpulanFormData(prev => ({ ...prev, nilai: e.target.value }))}
                        className="bg-input/50 border-border/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Catatan</Label>
                      <Textarea
                        value={pengumpulanFormData.catatan}
                        onChange={(e) => setPengumpulanFormData(prev => ({ ...prev, catatan: e.target.value }))}
                        className="bg-input/50 border-border/50"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setPengumpulanDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="glow-effect">
                        {editingPengumpulan ? 'Simpan' : 'Tambah'}
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
                Daftar Pengumpulan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : pengumpulanList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Belum ada pengumpulan</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Laporan</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Nilai</TableHead>
                        {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pengumpulanList.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {item.siswa?.nama || '-'}
                          </TableCell>
                          <TableCell>{item.laporan_prakerin?.judul || '-'}</TableCell>
                          <TableCell>
                            {item.tanggal_pengumpulan ? formatDate(item.tanggal_pengumpulan) : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            {item.nilai !== null ? (
                              <Badge className={item.nilai >= 75 ? 'bg-green-600' : 'bg-yellow-600'}>
                                {item.nilai.toFixed(2)}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditPengumpulan(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeletePengumpulan(item.id)}
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

export default LaporanPrakerinContent;
