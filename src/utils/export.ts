import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any) => string;
}

export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (data.length === 0) {
    throw new Error('Tidak ada data untuk diekspor');
  }

  const headers = columns.map(col => col.label);
  
  const csvContent = [
    headers.join(','),
    ...data.map(item => 
      columns.map(col => {
        const value = getValue(item, col.key);
        const formatted = col.formatter ? col.formatter(value) : value;
        return `"${String(formatted || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename + '.csv', 'text/csv;charset=utf-8;');
}

export function exportToPDF<T>(
  data: T[],
  columns: ExportColumn[],
  filename: string,
  title?: string,
  subtitle?: string
): void {
  if (data.length === 0) {
    throw new Error('Tidak ada data untuk diekspor');
  }

  const doc = new jsPDF();
  
  // Title
  if (title) {
    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  }
  
  // Subtitle
  let yPos = title ? 35 : 20;
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 20, yPos);
    yPos += 10;
  }
  
  // Total data info
  doc.setFontSize(10);
  doc.text(`Total Data: ${data.length}`, 20, yPos);
  yPos += 10;

  // Table data
  const tableData = data.map(item =>
    columns.map(col => {
      const value = getValue(item, col.key);
      return col.formatter ? col.formatter(value) : String(value || '');
    })
  );

  doc.autoTable({
    head: [columns.map(col => col.label)],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 211, 238] }, // Cyan color
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });

  doc.save(filename + '.pdf');
}

function getValue<T>(item: T, key: string): any {
  return key.includes('.') 
    ? key.split('.').reduce((obj, k) => obj?.[k], item as any)
    : (item as any)[key];
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}