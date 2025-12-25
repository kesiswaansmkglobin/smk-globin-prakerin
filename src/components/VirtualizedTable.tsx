import React, { memo, useMemo, useCallback, CSSProperties, ReactElement } from 'react';
import { List } from 'react-window';

interface Column<T> {
  key: string;
  header: string;
  width?: number;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  rowHeight?: number;
  maxHeight?: number;
  emptyMessage?: string;
  className?: string;
}

interface RowData<T> {
  items: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
}

interface RowProps<T> {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: CSSProperties;
  items: T[];
  columns: Column<T>[];
}

function RowComponent<T>({ index, style, items, columns }: RowProps<T>): ReactElement {
  const item = items[index];

  return (
    <div style={style} className="flex items-center border-b border-border/50 hover:bg-muted/50">
      {columns.map((column) => (
        <div
          key={column.key}
          className={`px-4 py-2 flex-shrink-0 ${column.className || ''}`}
          style={{ width: column.width || 150 }}
        >
          {column.render ? column.render(item, index) : (item as any)[column.key]}
        </div>
      ))}
    </div>
  );
}

function VirtualizedTableComponent<T>({
  data,
  columns,
  keyExtractor,
  rowHeight = 48,
  maxHeight = 600,
  emptyMessage = 'Tidak ada data',
  className = ''
}: VirtualizedTableProps<T>) {
  const totalWidth = useMemo(() => {
    return columns.reduce((acc, col) => acc + (col.width || 150), 0);
  }, [columns]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const listHeight = Math.min(data.length * rowHeight, maxHeight);

  return (
    <div className={`rounded-md border border-border/50 ${className}`}>
      {/* Header */}
      <div 
        className="flex bg-muted/30 border-b border-border/50"
        style={{ minWidth: totalWidth }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={`px-4 py-3 font-medium text-muted-foreground flex-shrink-0 ${column.className || ''}`}
            style={{ width: column.width || 150 }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <div style={{ minWidth: totalWidth }}>
        <List
          style={{ height: listHeight, width: '100%' }}
          rowCount={data.length}
          rowHeight={rowHeight}
          rowProps={{ items: data, columns }}
          rowComponent={RowComponent as any}
        />
      </div>
    </div>
  );
}

export const VirtualizedTable = memo(VirtualizedTableComponent) as typeof VirtualizedTableComponent;
