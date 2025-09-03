import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Filter, Calendar, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, exportToPDF } from '@/utils/export';
import { formatDate, formatDateRange } from '@/utils/formatters';

interface LaporanContentProps {
  user: any;
}

const LaporanContent = ({ user }: LaporanContentProps) => {
  const [prakerin, setPrakerin] = useState<any[]>([]);
  const [filteredPrakerin, setFilteredPrakerin] = useState<any[]>([]);
  const [jurusan, setJurusan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    selesai: 0,
    rataRataNilai: 0
  });
  const [filters, setFilters] = useState({
    jurusan: user?.role === 'kaprog' ? user.jurusan : '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    status: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [prakerin, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      let prakerinQuery = supabase
        .from('prakerin')
        .select(`
          *,
          siswa(
            nis,
            nama,
            kelas(nama, tingkat),
            jurusan(nama)
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by user's jurusan if not admin
      if (user?.role === 'kaprog') {
        // First get the jurusan ID for the kaprog user
        const { data: jurusanData } = await supabase
          .from('jurusan')
          .select('id')
          .eq('nama', user.jurusan)
          .single();
          
        if (jurusanData) {
          prakerinQuery = prakerinQuery
            .eq('siswa.jurusan_id', jurusanData.id);
        }
      }

      const [prakerinRes, jurusanRes] = await Promise.all([
        prakerinQuery,
        supabase.from('jurusan').select('*').order('nama')
      ]);

      if (prakerinRes.error) {
        console.error('Prakerin query error:', prakerinRes.error);
        throw prakerinRes.error;
      }
      if (jurusanRes.error) {
        console.error('Jurusan query error:', jurusanRes.error);
        throw jurusanRes.error;
      }

      const prakerinData = prakerinRes.data || [];
      console.log('Loaded prakerin data:', prakerinData);
      setPrakerin(prakerinData);
      setJurusan(jurusanRes.data || []);

      // Calculate statistics
      const total = prakerinData.length;
      const aktif = prakerinData.filter(p => p.status === 'aktif').length;
      const selesai = prakerinData.filter(p => p.status === 'selesai' || p.nilai_akhir).length;
      const nilaiList = prakerinData.filter(p => p.nilai_akhir).map(p => p.nilai_akhir);
      const rataRataNilai = nilaiList.length > 0 
        ? nilaiList.reduce((sum, nilai) => sum + nilai, 0) / nilaiList.length 
        : 0;

      setStats({ total, aktif, selesai, rataRataNilai });
    } catch (error: any) {
      console.error('Load data error:', error);
      toast({
        title: "Error",
        description: `Gagal memuat data: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...prakerin];

    // Filter by jurusan
    if (filters.jurusan) {
      filtered = filtered.filter(item => item.siswa?.jurusan?.nama === filters.jurusan);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Filter by date range
    if (filters.tanggal_mulai) {
      filtered = filtered.filter(item => 
        !item.tanggal_mulai || new Date(item.tanggal_mulai) >= new Date(filters.tanggal_mulai)
      );
    }

    if (filters.tanggal_selesai) {
      filtered = filtered.filter(item => 
        !item.tanggal_selesai || new Date(item.tanggal_selesai) <= new Date(filters.tanggal_selesai)
      );
    }

    setFilteredPrakerin(filtered);
  };

  const resetFilters = () => {
    setFilters({
      jurusan: user?.role === 'kaprog' ? user.jurusan : '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      status: ''
    });
  };

  const handleExportCSV = () => {
    if (filteredPrakerin.length === 0) {
      toast({
        title: "Peringatan",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive"
      });
      return;
    }

    const columns = [
      { key: 'siswa.nis', label: 'NIS' },
      { key: 'siswa.nama', label: 'Nama Siswa' },
      { key: 'siswa.jurusan.nama', label: 'Jurusan' },
      { key: 'siswa.kelas.nama', label: 'Kelas' },
      { key: 'tempat_prakerin', label: 'Tempat Prakerin' },
      { key: 'alamat_prakerin', label: 'Alamat Prakerin' },
      { 
        key: 'tanggal_mulai', 
        label: 'Tanggal Mulai',
        formatter: formatDate
      },
      { 
        key: 'tanggal_selesai', 
        label: 'Tanggal Selesai',
        formatter: formatDate
      },
      { key: 'pembimbing_sekolah', label: 'Pembimbing Sekolah' },
      { key: 'pembimbing_industri', label: 'Pembimbing Industri' },
      { key: 'nilai_akhir', label: 'Nilai Akhir' },
      { key: 'status', label: 'Status' },
      { key: 'keterangan', label: 'Keterangan' }
    ];

    try {
      exportToCSV(filteredPrakerin, columns, `laporan_prakerin_${new Date().toISOString().split('T')[0]}`);
      
      toast({
        title: "Berhasil",
        description: "Data berhasil diekspor ke CSV"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = () => {
    if (filteredPrakerin.length === 0) {
      toast({
        title: "Peringatan",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive"
      });
      return;
    }

    const columns = [
      { key: 'siswa.nis', label: 'NIS' },
      { key: 'siswa.nama', label: 'Nama Siswa' },
      { key: 'siswa.jurusan.nama', label: 'Jurusan' },
      { key: 'siswa.kelas.nama', label: 'Kelas' },
      { key: 'tempat_prakerin', label: 'Tempat Prakerin' },
      { 
        key: 'periode', 
        label: 'Periode',
        formatter: (_, item) => formatDateRange(item.tanggal_mulai, item.tanggal_selesai)
      },
      { key: 'nilai_akhir', label: 'Nilai' }
    ];

    const title = 'LAPORAN DATA PRAKERIN SMK GLOBIN';
    let subtitle = `Total Data: ${filteredPrakerin.length}`;
    if (filters.jurusan) subtitle += ` | Jurusan: ${filters.jurusan}`;

    try {
      exportToPDF(filteredPrakerin, columns, `laporan_prakerin_${new Date().toISOString().split('T')[0]}`, title, subtitle);
      
      toast({
        title: "Berhasil",
        description: "Data berhasil diekspor ke PDF"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Rekap & Laporan</h1>
        <p className="text-muted-foreground">
          {user?.role === 'kaprog' 
            ? `Filter dan unduh laporan prakerin jurusan ${user.jurusan}` 
            : 'Filter dan unduh laporan prakerin'
          }
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-gradient border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prakerin</p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sedang Aktif</p>
                <p className="text-2xl font-bold text-blue-500">{stats.aktif}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selesai</p>
                <p className="text-2xl font-bold text-green-500">{stats.selesai}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {stats.rataRataNilai > 0 ? stats.rataRataNilai.toFixed(1) : '-'}
                </p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5 text-primary" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {user?.role === 'admin' && (
              <div className="space-y-2">
                <Label htmlFor="filter-jurusan">Jurusan</Label>
                <Select 
                  value={filters.jurusan} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, jurusan: value }))}
                >
                  <SelectTrigger className="bg-input/50 border-border/50">
                    <SelectValue placeholder="Semua jurusan" />
                  </SelectTrigger>
                  <SelectContent className="card-gradient border-border/50">
                    <SelectItem value="">Semua Jurusan</SelectItem>
                    {jurusan.map((item) => (
                      <SelectItem key={item.id} value={item.nama}>
                        {item.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="bg-input/50 border-border/50">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent className="card-gradient border-border/50">
                  <SelectItem value="">Semua Status</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filter-mulai">Tanggal Mulai (Dari)</Label>
              <Input
                id="filter-mulai"
                type="date"
                value={filters.tanggal_mulai}
                onChange={(e) => setFilters(prev => ({ ...prev, tanggal_mulai: e.target.value }))}
                className="bg-input/50 border-border/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filter-selesai">Tanggal Selesai (Sampai)</Label>
              <Input
                id="filter-selesai"
                type="date"
                value={filters.tanggal_selesai}
                onChange={(e) => setFilters(prev => ({ ...prev, tanggal_selesai: e.target.value }))}
                className="bg-input/50 border-border/50"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filter
            </Button>
            <Button className="glow-effect" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Unduh CSV
            </Button>
            <Button className="glow-effect" onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Unduh PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Hasil Filter ({filteredPrakerin.length} data)
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : filteredPrakerin.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data yang sesuai dengan filter
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
                    <TableHead>Kelas</TableHead>
                    <TableHead>Tempat Prakerin</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Pembimbing Sekolah</TableHead>
                    <TableHead>Pembimbing Industri</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrakerin.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.siswa?.nis}</TableCell>
                      <TableCell className="font-medium">{item.siswa?.nama}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.siswa?.jurusan?.nama}</Badge>
                      </TableCell>
                      <TableCell>{item.siswa?.kelas?.nama || '-'}</TableCell>
                      <TableCell>{item.tempat_prakerin || '-'}</TableCell>
                      <TableCell>
                        {formatDateRange(item.tanggal_mulai, item.tanggal_selesai)}
                      </TableCell>
                      <TableCell>{item.pembimbing_sekolah || '-'}</TableCell>
                      <TableCell>{item.pembimbing_industri || '-'}</TableCell>
                      <TableCell>
                        {item.nilai_akhir ? (
                          <Badge 
                            variant={item.nilai_akhir >= 75 ? "default" : "destructive"}
                          >
                            {item.nilai_akhir}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.status === 'aktif' ? "default" : "secondary"}
                        >
                          {item.status || 'aktif'}
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
    </div>
  );
};

export default LaporanContent;