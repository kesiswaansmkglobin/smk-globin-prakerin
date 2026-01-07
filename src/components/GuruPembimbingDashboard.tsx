import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  ClipboardList, 
  Star, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2,
  TrendingUp,
  Briefcase,
  LogOut
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface GuruPembimbingDashboardProps {
  user: any;
}

interface Siswa {
  id: string;
  nama: string;
  nis: string;
  kelas: { nama: string } | null;
  jurusan: { nama: string } | null;
}

interface Prakerin {
  id: string;
  siswa_id: string;
  tempat_prakerin: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  status: string | null;
  nilai_akhir: number | null;
  siswa: Siswa | null;
}

interface Bimbingan {
  id: string;
  prakerin_id: string;
  tanggal: string;
  kegiatan: string;
  catatan: string | null;
  paraf: boolean;
}

interface ItemPenilaian {
  id: string;
  nama: string;
  kategori: string;
  bobot: number;
}

interface Nilai {
  id: string;
  prakerin_id: string;
  item_penilaian_id: string;
  nilai: number;
  keterangan: string | null;
  item_penilaian?: ItemPenilaian;
}

const GuruPembimbingDashboard = ({ user }: GuruPembimbingDashboardProps) => {
  const [prakerinList, setPrakerinList] = useState<Prakerin[]>([]);
  const [bimbinganList, setBimbinganList] = useState<Bimbingan[]>([]);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [itemPenilaianList, setItemPenilaianList] = useState<ItemPenilaian[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrakerin, setSelectedPrakerin] = useState<Prakerin | null>(null);
  
  // Bimbingan form
  const [bimbinganDialogOpen, setBimbinganDialogOpen] = useState(false);
  const [editingBimbingan, setEditingBimbingan] = useState<Bimbingan | null>(null);
  const [bimbinganForm, setBimbinganForm] = useState({
    prakerin_id: '',
    tanggal: '',
    kegiatan: '',
    catatan: '',
    paraf: false
  });

  // Nilai form
  const [nilaiDialogOpen, setNilaiDialogOpen] = useState(false);
  const [nilaiForm, setNilaiForm] = useState({
    prakerin_id: '',
    item_penilaian_id: '',
    nilai: '',
    keterangan: ''
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const guruPembimbingId = user?.guru_pembimbing_id || user?.id;

      // Load prakerin data for this guru pembimbing
      const { data: prakerinData, error: prakerinError } = await supabase
        .from('prakerin')
        .select(`
          *,
          siswa(id, nama, nis, kelas(nama), jurusan(nama))
        `)
        .eq('guru_pembimbing_id', guruPembimbingId)
        .order('created_at', { ascending: false });

      if (prakerinError) throw prakerinError;
      setPrakerinList(prakerinData || []);

      // Load bimbingan data
      const { data: bimbinganData, error: bimbinganError } = await supabase
        .from('bimbingan')
        .select('*')
        .eq('guru_pembimbing_id', guruPembimbingId)
        .order('tanggal', { ascending: false });

      if (bimbinganError) throw bimbinganError;
      setBimbinganList(bimbinganData || []);

      // Load nilai data for prakerin managed by this guru
      if (prakerinData && prakerinData.length > 0) {
        const prakerinIds = prakerinData.map(p => p.id);
        const { data: nilaiData, error: nilaiError } = await supabase
          .from('nilai_prakerin')
          .select('*, item_penilaian(id, nama, kategori, bobot)')
          .in('prakerin_id', prakerinIds);

        if (nilaiError) throw nilaiError;
        setNilaiList(nilaiData || []);
      }

      // Load item penilaian
      const { data: itemData, error: itemError } = await supabase
        .from('item_penilaian')
        .select('*')
        .order('nama');

      if (itemError) throw itemError;
      setItemPenilaianList(itemData || []);

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

  // Realtime subscriptions
  useRealtimeSubscription({
    table: 'bimbingan',
    onInsert: loadData,
    onUpdate: loadData,
    onDelete: loadData,
    showToast: false
  });

  useRealtimeSubscription({
    table: 'nilai_prakerin',
    onInsert: loadData,
    onUpdate: loadData,
    onDelete: loadData,
    showToast: false
  });

  // Bimbingan CRUD
  const handleBimbinganSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const guruPembimbingId = user?.guru_pembimbing_id || user?.id;
      const data = {
        prakerin_id: bimbinganForm.prakerin_id,
        guru_pembimbing_id: guruPembimbingId,
        tanggal: bimbinganForm.tanggal,
        kegiatan: bimbinganForm.kegiatan,
        catatan: bimbinganForm.catatan || null,
        paraf: bimbinganForm.paraf
      };

      if (editingBimbingan) {
        const { error } = await supabase
          .from('bimbingan')
          .update(data)
          .eq('id', editingBimbingan.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Bimbingan berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from('bimbingan')
          .insert([data]);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Bimbingan berhasil ditambahkan" });
      }

      setBimbinganDialogOpen(false);
      resetBimbinganForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBimbingan = async (id: string) => {
    if (!confirm('Hapus catatan bimbingan ini?')) return;
    try {
      const { error } = await supabase
        .from('bimbingan')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Berhasil", description: "Bimbingan berhasil dihapus" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus bimbingan",
        variant: "destructive"
      });
    }
  };

  const resetBimbinganForm = () => {
    setBimbinganForm({
      prakerin_id: '',
      tanggal: '',
      kegiatan: '',
      catatan: '',
      paraf: false
    });
    setEditingBimbingan(null);
  };

  // Nilai CRUD
  const handleNilaiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const guruPembimbingId = user?.guru_pembimbing_id || user?.id;
      
      // Check if nilai already exists
      const { data: existingNilai } = await supabase
        .from('nilai_prakerin')
        .select('id')
        .eq('prakerin_id', nilaiForm.prakerin_id)
        .eq('item_penilaian_id', nilaiForm.item_penilaian_id)
        .single();

      const data = {
        prakerin_id: nilaiForm.prakerin_id,
        item_penilaian_id: nilaiForm.item_penilaian_id,
        nilai: parseFloat(nilaiForm.nilai),
        keterangan: nilaiForm.keterangan || null,
        dinilai_oleh: guruPembimbingId
      };

      if (existingNilai) {
        const { error } = await supabase
          .from('nilai_prakerin')
          .update(data)
          .eq('id', existingNilai.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Nilai berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from('nilai_prakerin')
          .insert([data]);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Nilai berhasil ditambahkan" });
      }

      // Calculate and update nilai akhir
      await updateNilaiAkhir(nilaiForm.prakerin_id);

      setNilaiDialogOpen(false);
      resetNilaiForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const updateNilaiAkhir = async (prakerinId: string) => {
    try {
      // Calculate average using the database function
      const { data, error } = await supabase
        .rpc('calculate_nilai_akhir', { p_prakerin_id: prakerinId });

      if (error) throw error;

      // Update prakerin with calculated nilai_akhir
      const nilaiAkhir = data || 0;
      await supabase
        .from('prakerin')
        .update({ nilai_akhir: Math.round(nilaiAkhir * 100) / 100 })
        .eq('id', prakerinId);

    } catch (error) {
      console.error('Error calculating nilai akhir:', error);
    }
  };

  const resetNilaiForm = () => {
    setNilaiForm({
      prakerin_id: '',
      item_penilaian_id: '',
      nilai: '',
      keterangan: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBimbinganForPrakerin = (prakerinId: string) => {
    return bimbinganList.filter(b => b.prakerin_id === prakerinId);
  };

  const getNilaiForPrakerin = (prakerinId: string) => {
    return nilaiList.filter(n => n.prakerin_id === prakerinId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Aktif</Badge>;
      case 'selesai':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Selesai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Memuat data...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard Guru Pembimbing</h1>
          <p className="text-muted-foreground">Selamat datang, {user?.name}</p>
        </div>
        <Button 
          variant="outline" 
          className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-gradient border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Siswa Bimbingan</p>
                <p className="text-2xl font-bold text-primary">{prakerinList.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bimbingan</p>
                <p className="text-2xl font-bold text-primary">{bimbinganList.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nilai Diinput</p>
                <p className="text-2xl font-bold text-primary">{nilaiList.length}</p>
              </div>
              <Star className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selesai Prakerin</p>
                <p className="text-2xl font-bold text-primary">
                  {prakerinList.filter(p => p.status === 'selesai').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="siswa" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="siswa">Siswa Bimbingan</TabsTrigger>
          <TabsTrigger value="bimbingan">Catatan Bimbingan</TabsTrigger>
          <TabsTrigger value="nilai">Input Nilai</TabsTrigger>
        </TabsList>

        {/* Tab Siswa Bimbingan */}
        <TabsContent value="siswa">
          <Card className="card-gradient border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-primary" />
                Daftar Siswa Bimbingan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {prakerinList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada siswa bimbingan
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
                        <TableHead>Status</TableHead>
                        <TableHead>Nilai Akhir</TableHead>
                        <TableHead>Bimbingan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prakerinList.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.siswa?.nis}</TableCell>
                          <TableCell className="font-medium">{item.siswa?.nama}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.siswa?.kelas?.nama}</Badge>
                          </TableCell>
                          <TableCell>{item.tempat_prakerin || '-'}</TableCell>
                          <TableCell>{getStatusBadge(item.status || 'aktif')}</TableCell>
                          <TableCell>
                            {item.nilai_akhir ? (
                              <Badge className={item.nilai_akhir >= 75 ? "bg-green-500" : "bg-red-500"}>
                                {item.nilai_akhir.toFixed(2)}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getBimbinganForPrakerin(item.id).length}x
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Bimbingan */}
        <TabsContent value="bimbingan">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 text-primary" />
                Catatan Bimbingan
              </CardTitle>
              <Dialog open={bimbinganDialogOpen} onOpenChange={setBimbinganDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetBimbinganForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Bimbingan
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBimbingan ? 'Edit Bimbingan' : 'Tambah Bimbingan'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleBimbinganSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Siswa Prakerin *</Label>
                      <Select
                        value={bimbinganForm.prakerin_id}
                        onValueChange={(v) => setBimbinganForm(prev => ({ ...prev, prakerin_id: v }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih siswa" />
                        </SelectTrigger>
                        <SelectContent>
                          {prakerinList.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.siswa?.nama} - {p.tempat_prakerin}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tanggal *</Label>
                      <Input
                        type="date"
                        value={bimbinganForm.tanggal}
                        onChange={(e) => setBimbinganForm(prev => ({ ...prev, tanggal: e.target.value }))}
                        className="bg-input/50 border-border/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kegiatan *</Label>
                      <Input
                        value={bimbinganForm.kegiatan}
                        onChange={(e) => setBimbinganForm(prev => ({ ...prev, kegiatan: e.target.value }))}
                        placeholder="Contoh: Monitoring minggu ke-1"
                        className="bg-input/50 border-border/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Catatan</Label>
                      <Textarea
                        value={bimbinganForm.catatan}
                        onChange={(e) => setBimbinganForm(prev => ({ ...prev, catatan: e.target.value }))}
                        placeholder="Catatan tambahan..."
                        className="bg-input/50 border-border/50"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="paraf"
                        checked={bimbinganForm.paraf}
                        onCheckedChange={(c) => setBimbinganForm(prev => ({ ...prev, paraf: c as boolean }))}
                      />
                      <Label htmlFor="paraf">Sudah Paraf</Label>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setBimbinganDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="glow-effect">
                        {editingBimbingan ? 'Simpan' : 'Tambah'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {bimbinganList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada catatan bimbingan
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Kegiatan</TableHead>
                        <TableHead>Catatan</TableHead>
                        <TableHead>Paraf</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bimbinganList.map((item) => {
                        const prakerin = prakerinList.find(p => p.id === item.prakerin_id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{formatDate(item.tanggal)}</TableCell>
                            <TableCell>{prakerin?.siswa?.nama || '-'}</TableCell>
                            <TableCell>{item.kegiatan}</TableCell>
                            <TableCell className="max-w-xs truncate">{item.catatan || '-'}</TableCell>
                            <TableCell>
                              {item.paraf ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingBimbingan(item);
                                    setBimbinganForm({
                                      prakerin_id: item.prakerin_id,
                                      tanggal: item.tanggal,
                                      kegiatan: item.kegiatan,
                                      catatan: item.catatan || '',
                                      paraf: item.paraf
                                    });
                                    setBimbinganDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteBimbingan(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
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

        {/* Tab Nilai */}
        <TabsContent value="nilai">
          <Card className="card-gradient border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5 text-primary" />
                Input Nilai Prakerin
              </CardTitle>
              <Dialog open={nilaiDialogOpen} onOpenChange={setNilaiDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetNilaiForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Input Nilai
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50">
                  <DialogHeader>
                    <DialogTitle>Input Nilai Prakerin</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleNilaiSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Siswa Prakerin *</Label>
                      <Select
                        value={nilaiForm.prakerin_id}
                        onValueChange={(v) => setNilaiForm(prev => ({ ...prev, prakerin_id: v }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih siswa" />
                        </SelectTrigger>
                        <SelectContent>
                          {prakerinList.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.siswa?.nama} - {p.tempat_prakerin}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Item Penilaian *</Label>
                      <Select
                        value={nilaiForm.item_penilaian_id}
                        onValueChange={(v) => setNilaiForm(prev => ({ ...prev, item_penilaian_id: v }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih item penilaian" />
                        </SelectTrigger>
                        <SelectContent>
                          {itemPenilaianList.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.nama} ({item.kategori})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nilai (0-100) *</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={nilaiForm.nilai}
                        onChange={(e) => setNilaiForm(prev => ({ ...prev, nilai: e.target.value }))}
                        placeholder="0-100"
                        className="bg-input/50 border-border/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Keterangan</Label>
                      <Textarea
                        value={nilaiForm.keterangan}
                        onChange={(e) => setNilaiForm(prev => ({ ...prev, keterangan: e.target.value }))}
                        placeholder="Keterangan nilai..."
                        className="bg-input/50 border-border/50"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setNilaiDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="glow-effect">
                        Simpan Nilai
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {prakerinList.map((prakerin) => {
                  const nilaiPrakerin = getNilaiForPrakerin(prakerin.id);
                  return (
                    <Card key={prakerin.id} className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{prakerin.siswa?.nama}</h3>
                            <p className="text-sm text-muted-foreground">
                              {prakerin.tempat_prakerin} | NIS: {prakerin.siswa?.nis}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Nilai Akhir</p>
                            <p className="text-xl font-bold text-primary">
                              {prakerin.nilai_akhir ? prakerin.nilai_akhir.toFixed(2) : '-'}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {nilaiPrakerin.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Belum ada nilai</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {nilaiPrakerin.map((nilai) => (
                              <div key={nilai.id} className="p-2 bg-background/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                  {nilai.item_penilaian?.nama}
                                </p>
                                <p className="font-semibold">{nilai.nilai}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuruPembimbingDashboard;
