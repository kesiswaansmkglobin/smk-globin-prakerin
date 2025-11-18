import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { useSupabaseMutation } from '@/hooks/useSupabaseMutation';
import { useFormDialog } from '@/hooks/useFormDialog';
import { DataTable } from '@/components/common/DataTable';
import { canEditJurusan } from '@/utils/permissions';
import type { Jurusan } from '@/types';

interface JurusanContentProps {
  user: any;
}

const JurusanContent = ({ user }: JurusanContentProps) => {
  const { toast } = useToast();

  // Use custom hooks for data fetching and mutations with better error handling
  const { data: jurusan, loading, error, refetch } = useSupabaseQuery<Jurusan>({
    table: 'jurusan',
    select: '*',
    orderBy: { column: 'nama', ascending: true }
  });

  // Debug logging
  console.log('JurusanContent state:', { 
    jurusan: jurusan?.length || 0, 
    loading, 
    error 
  });

  const mutation = useSupabaseMutation({
    table: 'jurusan',
    onSuccess: () => {
      refetch();
      closeDialog();
    }
  });

  const {
    dialogOpen,
    editingItem,
    formData,
    openDialog,
    closeDialog,
    handleFieldChange,
    isEditing
  } = useFormDialog({
    initialFormData: { nama: '' }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      await mutation.update(editingItem.id, formData);
    } else {
      await mutation.insert(formData);
    }
  };

  const handleDelete = async (item: Jurusan) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jurusan ini?')) return;
    
    await mutation.remove(item.id);
    refetch();
  };

  const columns = [
    {
      key: 'nama',
      label: 'Nama Jurusan',
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'created_at',
      label: 'Tanggal Dibuat',
      render: (value: string) => new Date(value).toLocaleDateString('id-ID')
    }
  ];

  const canEdit = canEditJurusan(user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Data Jurusan</h1>
          <p className="text-muted-foreground">
            Kelola data jurusan di SMK GLOBIN
          </p>
        </div>
        
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button className="glow-effect" onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Jurusan
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-surface border-border/50 overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? 'Edit Jurusan' : 'Tambah Jurusan'}
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Jurusan</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => handleFieldChange('nama', e.target.value)}
                      placeholder="Masukkan nama jurusan"
                      required
                      className="bg-input/50 border-border/50"
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Batal
                    </Button>
                    <Button type="submit" className="glow-effect" disabled={mutation.loading}>
                      {isEditing ? 'Simpan' : 'Tambah'}
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
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Daftar Jurusan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              Memuat data jurusan...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-destructive">Error: {error}</p>
              <button 
                onClick={() => {
                  refetch();
                  window.location.reload();
                }}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <DataTable
              data={jurusan}
              columns={columns}
              onEdit={canEdit ? openDialog : undefined}
              onDelete={canEdit ? handleDelete : undefined}
              loading={loading}
              emptyMessage="Belum ada data jurusan"
              canEdit={canEdit}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JurusanContent;