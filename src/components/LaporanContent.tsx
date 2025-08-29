import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface LaporanContentProps {
  user: any;
}

const LaporanContent = ({ user }: LaporanContentProps) => {
  const [prakerin, setPrakerin] = useState([]);
  const [filteredPrakerin, setFilteredPrakerin] = useState([]);
  const [jurusan, setJurusan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    jurusan: user?.role === 'kaprog' ? user.jurusan : '',
    tanggal_mulai: '',
    tanggal_selesai: ''
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

  const applyFilters = () => {
    let filtered = [...prakerin];

    // Filter by jurusan
    if (filters.jurusan) {
      filtered = filtered.filter(item => item.jurusan === filters.jurusan);
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
      tanggal_selesai: ''
    });
  };

  const exportToCSV = () => {
    if (filteredPrakerin.length === 0) {
      toast({
        title: "Peringatan",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'NIS',
      'Nama Siswa',
      'Jurusan',
      'Kelas',
      'Tempat Prakerin',
      'Alamat Prakerin',
      'Tanggal Mulai',
      'Tanggal Selesai',
      'Pembimbing Sekolah',
      'Pembimbing Industri',
      'Nilai Akhir',
      'Keterangan'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredPrakerin.map(item => [
        item.nis || '',
        `"${item.nama_siswa || ''}"`,
        `"${item.jurusan || ''}"`,
        `"${item.kelas || ''}"`,
        `"${item.tempat_prakerin || ''}"`,
        `"${item.alamat_prakerin || ''}"`,
        item.tanggal_mulai || '',
        item.tanggal_selesai || '',
        `"${item.pembimbing_sekolah || ''}"`,
        `"${item.pembimbing_industri || ''}"`,
        item.nilai_akhir || '',
        `"${item.keterangan || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_prakerin_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Berhasil",
      description: "Data berhasil diekspor ke CSV"
    });
  };

  const exportToPDF = () => {
    if (filteredPrakerin.length === 0) {
      toast({
        title: "Peringatan",
        description: "Tidak ada data untuk diekspor",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('LAPORAN DATA PRAKERIN SMK GLOBIN', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    // Filters info
    doc.setFontSize(10);
    let yPos = 35;
    if (filters.jurusan) {
      doc.text(`Jurusan: ${filters.jurusan}`, 20, yPos);
      yPos += 7;
    }
    if (filters.tanggal_mulai || filters.tanggal_selesai) {
      doc.text(`Periode: ${filters.tanggal_mulai || 'Awal'} s/d ${filters.tanggal_selesai || 'Akhir'}`, 20, yPos);
      yPos += 7;
    }
    doc.text(`Total Data: ${filteredPrakerin.length}`, 20, yPos);
    yPos += 10;

    // Table
    const tableData = filteredPrakerin.map(item => [
      item.nis || '',
      item.nama_siswa || '',
      item.jurusan || '',
      item.kelas || '',
      item.tempat_prakerin || '',
      item.tanggal_mulai && item.tanggal_selesai 
        ? `${new Date(item.tanggal_mulai).toLocaleDateString('id-ID')} s/d ${new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}`
        : '',
      item.nilai_akhir?.toString() || ''
    ]);

    doc.autoTable({
      head: [['NIS', 'Nama Siswa', 'Jurusan', 'Kelas', 'Tempat Prakerin', 'Periode', 'Nilai']],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 211, 238] }, // Cyan color
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });

    doc.save(`laporan_prakerin_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Berhasil",
      description: "Data berhasil diekspor ke PDF"
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
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

      {/* Filter Section */}
      <Card className="card-gradient border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5 text-primary" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <Button className="glow-effect" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Unduh CSV
            </Button>
            <Button className="glow-effect" onClick={exportToPDF}>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrakerin.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.nis}</TableCell>
                      <TableCell className="font-medium">{item.nama_siswa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.jurusan}</Badge>
                      </TableCell>
                      <TableCell>{item.kelas || '-'}</TableCell>
                      <TableCell>{item.tempat_prakerin || '-'}</TableCell>
                      <TableCell>
                        {item.tanggal_mulai && item.tanggal_selesai 
                          ? `${formatDate(item.tanggal_mulai)} s/d ${formatDate(item.tanggal_selesai)}`
                          : '-'
                        }
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