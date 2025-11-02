import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Kelas, Jurusan, Siswa } from '@/types';

interface ImportSiswaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kelasList: Kelas[];
  jurusanList: Jurusan[];
}

interface ParsedSiswa {
  nis: string;
  nama: string;
  kelas_id: string;
  jurusan_id: string;
  jenis_kelamin?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  nama_orangtua?: string;
  telepon_orangtua?: string;
  errors?: string[];
}

export function ImportSiswaDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  kelasList, 
  jurusanList 
}: ImportSiswaDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [selectedJurusan, setSelectedJurusan] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetDialog = () => {
    setFile(null);
    setParsedData([]);
    setStep('upload');
    setSelectedJurusan('');
    setSelectedKelas('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const downloadTemplate = () => {
    const headers = [
      'NIS',
      'Nama',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Alamat',
      'Telepon',
      'Email',
      'Nama Orang Tua',
      'Telepon Orang Tua'
    ];

    const sampleData = [
      [
        '12345678',
        'John Doe',
        'L',
        'Jakarta',
        '2006-01-15',
        'Jl. Contoh No. 123',
        '081234567890',
        'john@example.com',
        'Jane Doe',
        '081234567891'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_siswa.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Berhasil",
      description: "Template CSV berhasil diunduh"
    });
  };

  const parseCSV = (csvText: string): ParsedSiswa[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const errors: string[] = [];
      
      // Basic validation
      const nis = values[0];
      const nama = values[1];
      
      if (!nis) errors.push('NIS wajib diisi');
      if (!nama) errors.push('Nama wajib diisi');
      if (nis && nis.length < 8) errors.push('NIS minimal 8 karakter');
      
      return {
        nis,
        nama,
        kelas_id: selectedKelas,
        jurusan_id: selectedJurusan,
        jenis_kelamin: values[2] || undefined,
        tempat_lahir: values[3] || undefined,
        tanggal_lahir: values[4] || undefined,
        alamat: values[5] || undefined,
        telepon: values[6] || undefined,
        email: values[7] || undefined,
        nama_orangtua: values[8] || undefined,
        telepon_orangtua: values[9] || undefined,
        errors: errors.length > 0 ? errors : undefined
      };
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Error",
        description: "File harus berformat CSV",
        variant: "destructive"
      });
      return;
    }

    if (!selectedJurusan || !selectedKelas) {
      toast({
        title: "Error", 
        description: "Pilih jurusan dan kelas terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

    try {
      const text = await uploadedFile.text();
      const parsed = parseCSV(text);
      setParsedData(parsed);
      setStep('preview');
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membaca file CSV",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const validData = parsedData.filter(item => !item.errors);
    
    if (validData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data valid untuk diimpor",
        variant: "destructive"
      });
      return;
    }

    setStep('importing');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('siswa')
        .insert(validData.map(item => ({
          nis: item.nis,
          nama: item.nama,
          kelas_id: item.kelas_id,
          jurusan_id: item.jurusan_id,
          jenis_kelamin: item.jenis_kelamin,
          tempat_lahir: item.tempat_lahir,
          tanggal_lahir: item.tanggal_lahir,
          alamat: item.alamat,
          telepon: item.telepon,
          email: item.email,
          nama_orangtua: item.nama_orangtua,
          telepon_orangtua: item.telepon_orangtua
        })));

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `${validData.length} siswa berhasil diimpor`
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengimpor data siswa",
        variant: "destructive"
      });
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedData.filter(item => !item.errors).length;
  const errorCount = parsedData.filter(item => item.errors).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="dialog-surface border-border/50 max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Impor Data Siswa</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
          {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload File CSV</h3>
              <p className="text-muted-foreground mb-4">
                Pilih file CSV yang berisi data siswa untuk diimpor
              </p>
              
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="mb-4"
              >
                <Download className="mr-2 h-4 w-4" />
                Unduh Template CSV
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jurusan</Label>
                <Select value={selectedJurusan} onValueChange={setSelectedJurusan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jurusan" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurusanList.map(jurusan => (
                      <SelectItem key={jurusan.id} value={jurusan.id}>
                        {jurusan.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select 
                  value={selectedKelas} 
                  onValueChange={setSelectedKelas}
                  disabled={!selectedJurusan}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {kelasList
                      .filter(kelas => kelas.jurusan_id === selectedJurusan)
                      .map(kelas => (
                        <SelectItem key={kelas.id} value={kelas.id}>
                          {kelas.nama}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>File CSV</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading || !selectedJurusan || !selectedKelas}
                className="bg-input/50 border-border/50"
              />
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview Data</h3>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Valid: {validCount}
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Error: {errorCount}
                  </Badge>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {parsedData.map((item, index) => (
                  <Card key={index} className={`p-3 ${item.errors ? 'border-destructive' : 'border-green-500'}`}>
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <div>
                          <Label className="text-xs text-muted-foreground">NIS</Label>
                          <p className="font-medium">{item.nis}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Nama</Label>
                          <p className="font-medium">{item.nama}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Jenis Kelamin</Label>
                          <p>{item.jenis_kelamin || '-'}</p>
                        </div>
                      </div>
                      <div className="ml-4">
                        {item.errors ? (
                          <Badge variant="destructive">Error</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500">Valid</Badge>
                        )}
                      </div>
                    </div>
                    {item.errors && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                        <ul className="text-xs text-destructive space-y-1">
                          {item.errors.map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Kembali
              </Button>
              <Button 
                onClick={handleImport}
                disabled={validCount === 0}
                className="glow-effect"
              >
                Impor {validCount} Siswa
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Mengimpor Data...</h3>
            <p className="text-muted-foreground">
              Mohon tunggu, sedang memproses data siswa
            </p>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}