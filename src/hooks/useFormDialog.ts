import { useState, useCallback } from 'react';

interface UseFormDialogOptions<T> {
  initialFormData: T;
  resetCallback?: () => void;
}

export function useFormDialog<T extends Record<string, any>>({
  initialFormData,
  resetCallback
}: UseFormDialogOptions<T>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<T>(initialFormData);

  const openDialog = useCallback((item?: any) => {
    if (item) {
      setEditingItem(item);
      // Map item properties to form data
      const mappedData = { ...initialFormData };
      Object.keys(initialFormData).forEach(key => {
        if (item[key] !== undefined) {
          mappedData[key as keyof T] = item[key];
        }
      });
      setFormData(mappedData);
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  }, [initialFormData]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData(initialFormData);
    resetCallback?.();
  }, [initialFormData, resetCallback]);

  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleFieldChange = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    dialogOpen,
    setDialogOpen,
    editingItem,
    formData,
    setFormData,
    openDialog,
    closeDialog,
    updateFormData,
    handleFieldChange,
    isEditing: !!editingItem
  };
}