import React, { memo, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface OptimizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  className?: string;
}

/**
 * Optimized table component with React.memo to prevent unnecessary re-renders
 * Uses useMemo for expensive computations
 */
function OptimizedTableComponent<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'Tidak ada data',
  className = ''
}: OptimizedTableProps<T>) {
  
  // Memoize table rows to prevent re-renders when parent re-renders
  const tableRows = useMemo(() => {
    return data.map((item, index) => (
      <TableRow key={keyExtractor(item)}>
        {columns.map((column) => (
          <TableCell key={column.key} className={column.className}>
            {column.render ? column.render(item, index) : (item as any)[column.key]}
          </TableCell>
        ))}
      </TableRow>
    ));
  }, [data, columns, keyExtractor]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>
    </div>
  );
}

// Memoize the entire component to prevent unnecessary re-renders
export const OptimizedTable = memo(OptimizedTableComponent) as typeof OptimizedTableComponent;
