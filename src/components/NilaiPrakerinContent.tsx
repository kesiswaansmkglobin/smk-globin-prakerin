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
import { Plus, Edit, Trash2, Award, Calculator, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface NilaiPrakerinContentProps {
  user: any;
}

interface ItemPenilaian {
  id: string;
  nama: string;
  bobot: number;
  kategori: string;
  jurusan_id: string | null;
}

interface NilaiPrakerin {
  id: string;
  prakerin_id: string;
  item_penilaian_id: string;
  nilai: number;
  keterangan: string | null;
  item_penilaian?: { nama: string; kategori: string } | null;
  prakerin?: {
    siswa: { nama: string; nis: string } | null;
    tempat_prakerin: string | null;
  } | null;
}

interface Prakerin {
  id: string;
  siswa: { nama: string; nis: string } | null;
  tempat_prakerin: string | null;
}

const NilaiPrakerinContent = ({ user }: NilaiPrakerinContentProps) => {
  const [nilaiList, setNilaiList] = useState<NilaiPrakerin[]>([]);
  const [itemPenilaianList, setItemPenilaianList] = useState<ItemPenilaian[]>([]);
  const [prakerinList, setPrakerinList] = useState<Prakerin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingNilai, setEditingNilai] = useState<NilaiPrakerin | null>(null);
  const [editingItem, setEditingItem] = useState<ItemPenilaian | null>(null);
  const [activeTab, setActiveTab] = useState('nilai');
  
  const [formData, setFormData] = useState({
    prakerin_id: '',
    item_penilaian_id: '',
    nilai: '',
    keterangan: ''
  });

  const [itemFormData, setItemFormData] = useState({
    nama: '',
    bobot: '1',
    kategori: 'industri'
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

      // Load nilai prakerin
      const nilaiQuery = supabase
        .from('nilai_prakerin')
        .select(`
          *,
          item_penilaian(nama, kategori),
          prakerin(
            siswa(nama, nis),
            tempat_prakerin
          )
        `)
        .order('created_at', { ascending: false });

      // Load item penilaian
      let itemQuery = supabase
        .from('item_penilaian')
        .select('*')
        .order('nama');

      if (userJurusanId) {
        itemQuery = itemQuery.eq('jurusan_id', userJurusanId);
      }

      // Load prakerin for dropdown
      let prakerinQuery = supabase
        .from('prakerin')
        .select(`
          id,
          tempat_prakerin,
          siswa!inner(nama, nis, jurusan_id)
        `)
        .order('created_at', { ascending: false });

      if (user?.role === 'kaprog' && userJurusanId) {
        prakerinQuery = prakerinQuery.eq('siswa.jurusan_id', userJurusanId);
      }

      const [nilaiRes, itemRes, prakerinRes] = await Promise.all([
        nilaiQuery,
        itemQuery,
        prakerinQuery
      ]);

      if (nilaiRes.error) throw nilaiRes.error;
      if (itemRes.error) throw itemRes.error;
      if (prakerinRes.error) throw prakerinRes.error;

      setNilaiList(nilaiRes.data || []);
      setItemPenilaianList(itemRes.data || []);
      setPrakerinList(prakerinRes.data || []);
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
    table: 'nilai_prakerin',
    onInsert: loadData,
    onUpdate: loadData,
    onDelete: loadData,
    showToast: true
  });

  const handleSubmitNilai = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        prakerin_id: formData.prakerin_id,
        item_penilaian_id: formData.item_penilaian_id,
        nilai: parseFloat(formData.nilai),
        keterangan: formData.keterangan || null
      };

      if (editingNilai) {
        const { error } = await supabase
          .from('nilai_prakerin')
          .update(data)
          .eq('id', editingNilai.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Nilai berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('nilai_prakerin')
          .insert([data]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Nilai berhasil ditambahkan"
        });
      }

      setDialogOpen(false);
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

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let jurusanId: string | null = null;
      if (user?.role === 'kaprog') {
        const { data } = await supabase
          .from('jurusan')
          .select('id')
          .eq('nama', user.jurusan)
          .single();
        jurusanId = data?.id || null;
      }

      const data = {
        nama: itemFormData.nama,
        bobot: parseInt(itemFormData.bobot),
        kategori: itemFormData.kategori,
        jurusan_id: jurusanId
      };

      if (editingItem) {
        const { error } = await supabase
          .from('item_penilaian')
          .update(data)
          .eq('id', editingItem.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Item penilaian berhasil diperbarui"
        });
      } else {
        const { error } = await supabase
          .from('item_penilaian')
          .insert([data]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Item penilaian berhasil ditambahkan"
        });
      }

      setItemDialogOpen(false);
      resetItemForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    }
  };

  const handleEditNilai = (nilai: NilaiPrakerin) => {
    setEditingNilai(nilai);
    setFormData({
      prakerin_id: nilai.prakerin_id,
      item_penilaian_id: nilai.item_penilaian_id,
      nilai: nilai.nilai.toString(),
      keterangan: nilai.keterangan || ''
    });
    setDialogOpen(true);
  };

  const handleEditItem = (item: ItemPenilaian) => {
    setEditingItem(item);
    setItemFormData({
      nama: item.nama,
      bobot: item.bobot.toString(),
      kategori: item.kategori
    });
    setItemDialogOpen(true);
  };

  const handleDeleteNilai = async (id: string) => {
    if (!confirm('Hapus nilai ini?')) return;

    try {
      const { error } = await supabase
        .from('nilai_prakerin')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Nilai berhasil dihapus" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: "Gagal menghapus", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Hapus item penilaian ini?')) return;

    try {
      const { error } = await supabase
        .from('item_penilaian')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Berhasil", description: "Item penilaian berhasil dihapus" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: "Gagal menghapus", variant: "destructive" });
    }
  };

  const resetNilaiForm = () => {
    setFormData({ prakerin_id: '', item_penilaian_id: '', nilai: '', keterangan: '' });
    setEditingNilai(null);
  };

  const resetItemForm = () => {
    setItemFormData({ nama: '', bobot: '1', kategori: 'industri' });
    setEditingItem(null);
  };

  const getNilaiColor = (nilai: number) => {
    if (nilai >= 85) return 'bg-green-600';
    if (nilai >= 75) return 'bg-blue-600';
    if (nilai >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const canEdit = user?.role === 'admin' || user?.role === 'kaprog';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Nilai Prakerin</h1>
          <p className="text-muted-foreground">Kelola nilai prakerin siswa</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="nilai" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Nilai
          </TabsTrigger>
          <TabsTrigger value="item" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Item Penilaian
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nilai" className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetNilaiForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Input Nilai
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingNilai ? 'Edit Nilai' : 'Input Nilai'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitNilai} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Siswa Prakerin *</Label>
                      <Select
                        value={formData.prakerin_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, prakerin_id: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih siswa" />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          {prakerinList.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.siswa?.nama} - {p.siswa?.nis}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Item Penilaian *</Label>
                      <Select
                        value={formData.item_penilaian_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, item_penilaian_id: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue placeholder="Pilih item penilaian" />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
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
                        value={formData.nilai}
                        onChange={(e) => setFormData(prev => ({ ...prev, nilai: e.target.value }))}
                        className="bg-input/50 border-border/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Keterangan</Label>
                      <Textarea
                        value={formData.keterangan}
                        onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                        className="bg-input/50 border-border/50"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="glow-effect">
                        {editingNilai ? 'Simpan' : 'Tambah'}
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
                <Award className="mr-2 h-5 w-5 text-primary" />
                Daftar Nilai
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : nilaiList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Belum ada data nilai</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Item Penilaian</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Nilai</TableHead>
                        <TableHead>Keterangan</TableHead>
                        {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nilaiList.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {item.prakerin?.siswa?.nama || '-'}
                          </TableCell>
                          <TableCell>{item.item_penilaian?.nama || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.item_penilaian?.kategori || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getNilaiColor(item.nilai)}>
                              {item.nilai.toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.keterangan || '-'}</TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditNilai(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteNilai(item.id)}
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

        <TabsContent value="item" className="space-y-4">
          <div className="flex justify-end">
            {canEdit && (
              <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-effect" onClick={resetItemForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-surface border-border/50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Item Penilaian' : 'Tambah Item Penilaian'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitItem} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nama Item *</Label>
                      <Input
                        value={itemFormData.nama}
                        onChange={(e) => setItemFormData(prev => ({ ...prev, nama: e.target.value }))}
                        placeholder="Contoh: Kedisiplinan"
                        className="bg-input/50 border-border/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <Select
                        value={itemFormData.kategori}
                        onValueChange={(value) => setItemFormData(prev => ({ ...prev, kategori: value }))}
                      >
                        <SelectTrigger className="bg-input/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="card-gradient border-border/50">
                          <SelectItem value="industri">Industri</SelectItem>
                          <SelectItem value="sidang">Sidang</SelectItem>
                          <SelectItem value="laporan">Laporan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Bobot</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={itemFormData.bobot}
                        onChange={(e) => setItemFormData(prev => ({ ...prev, bobot: e.target.value }))}
                        className="bg-input/50 border-border/50"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" className="glow-effect">
                        {editingItem ? 'Simpan' : 'Tambah'}
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
                <Settings className="mr-2 h-5 w-5 text-primary" />
                Daftar Item Penilaian
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : itemPenilaianList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Belum ada item penilaian</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Nama Item</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Bobot</TableHead>
                        {canEdit && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemPenilaianList.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.nama}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.kategori}</Badge>
                          </TableCell>
                          <TableCell>{item.bobot}</TableCell>
                          {canEdit && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditItem(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteItem(item.id)}
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

export default NilaiPrakerinContent;
