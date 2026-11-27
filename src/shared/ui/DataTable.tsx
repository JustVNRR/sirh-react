import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { Alert } from './Alert';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<TData>({
  columns,
  data,
  page,
  totalCount,
  totalPages,
  onPageChange,
  isLoading = false,
  errorMessage,
  emptyTitle = 'Aucun élément trouvé',
  emptyDescription = 'Aucune donnée ne correspond aux critères actuels.',
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  if (errorMessage) {
    return (
      <Alert variant="danger" title="Erreur de chargement">
        {errorMessage}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Database className="h-6 w-6" aria-hidden="true" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-xs uppercase text-[var(--muted-foreground)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col" className="px-4 py-3 font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-[var(--surface-muted)]/60">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-[var(--foreground)]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 text-sm text-[var(--muted-foreground)] sm:flex-row">
        <p className="tabular-nums">
          Page <span className="font-medium text-[var(--foreground)]">{page}</span> sur{' '}
          <span className="font-medium text-[var(--foreground)]">{Math.max(1, totalPages)}</span> —{' '}
          {totalCount} résultat{totalCount > 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Page suivante"
          >
            Suivant
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
