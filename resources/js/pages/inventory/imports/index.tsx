import { Head, router } from '@inertiajs/react';
import { ArrowUpDown, Download, FileWarning } from 'lucide-react';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { PaginatedData } from '@/types';

const ALL = '_all';
const IMPORTS_INDEX_URL = '/admin/imports';

type ImportHistoryItem = {
    id: number;
    type: string | null;
    status: string | null;
    total_rows: number | null;
    processed_rows: number;
    successful_rows: number;
    failed_rows: number;
    errors_count: number;
    file_name: string;
    user: { id: number; name: string } | null;
    created_at: string | null;
    started_at: string | null;
    finished_at: string | null;
};

type Props = {
    imports: PaginatedData<ImportHistoryItem>;
    statusOptions: string[];
    filters: {
        status?: string;
        sort_by?: 'id' | 'created_at';
        sort_direction?: 'asc' | 'desc';
        imports_page?: string;
    };
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
};

function resolvePaginationMeta<T>(payload: PaginatedData<T>): PaginationMeta {
    const fallbackCurrentPage = (payload as unknown as { current_page?: number }).current_page ?? 1;
    const fallbackLastPage = (payload as unknown as { last_page?: number }).last_page ?? 1;

    return {
        current_page: payload.meta?.current_page ?? fallbackCurrentPage,
        last_page: payload.meta?.last_page ?? fallbackLastPage,
    };
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    pending: { label: 'Pending', variant: 'secondary' },
    processing: { label: 'Processing', variant: 'secondary' },
    completed: { label: 'Completed', variant: 'default' },
    completed_with_errors: { label: 'Completed with errors', variant: 'outline' },
    failed: { label: 'Failed', variant: 'outline' },
};

function prettifyType(type: string | null): string {
    if (!type) {
        return '—';
    }

    return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return date;
}

function buildDownloadHref(importId: number): string {
    return `/admin/imports/${importId}/download`;
}

function buildErrorsExportHref(importId: number): string {
    return `/admin/imports/${importId}/errors-export`;
}

function applyFilters(filters: Props['filters'], payload: Partial<Props['filters']>) {
    router.get(IMPORTS_INDEX_URL, { ...filters, ...payload }, { preserveState: true, preserveScroll: true, replace: true });
}

function renderTableRows(items: ImportHistoryItem[]) {
    return items.map((importRun) => {
        const status = STATUS_BADGE[importRun.status ?? ''] ?? { label: importRun.status ?? 'Unknown', variant: 'outline' as const };

        return (
            <TableRow key={importRun.id}>
                <TableCell>#{importRun.id}</TableCell>
                <TableCell>{prettifyType(importRun.type)}</TableCell>
                <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="font-medium">{importRun.file_name}</TableCell>
                <TableCell>{importRun.user?.name ?? 'System'}</TableCell>
                <TableCell className="text-right">{importRun.processed_rows}</TableCell>
                <TableCell className="text-right">{importRun.successful_rows}</TableCell>
                <TableCell className="text-right">{importRun.failed_rows}</TableCell>
                <TableCell className="text-right">{importRun.errors_count}</TableCell>
                <TableCell>{formatDate(importRun.created_at)}</TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        {importRun.errors_count > 0 && (
                            <Button variant="outline" size="sm" asChild>
                                <a href={buildErrorsExportHref(importRun.id)}>
                                    <FileWarning className="mr-1 h-3.5 w-3.5" />
                                    Errors CSV
                                </a>
                            </Button>
                        )}

                        <Button variant="outline" size="sm" asChild>
                            <a href={buildDownloadHref(importRun.id)}>
                                <Download className="mr-1 h-3.5 w-3.5" />
                                Excel
                            </a>
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        );
    });
}

export default function ImportsHistoryIndex({ imports, statusOptions, filters }: Props) {
    const importsMeta = resolvePaginationMeta(imports);
    const currentSortBy = filters.sort_by ?? 'id';
    const currentSortDirection = filters.sort_direction ?? 'desc';
    const statusFilterOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All statuses' },
        ...statusOptions.map((status) => ({ value: status, label: status })),
    ];

    function toggleSort(column: 'id' | 'created_at'): void {
        const nextDirection = currentSortBy === column && currentSortDirection === 'desc' ? 'asc' : 'desc';

        applyFilters(filters, {
            sort_by: column,
            sort_direction: nextDirection,
            imports_page: undefined,
        });
    }

    return (
        <>
            <Head title="Imports" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-bold">Imports</h1>
                    <p className="text-sm text-muted-foreground">
                        Historical module for uploaded files, import runs and failed import tracking.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            <SearchableSelect
                                value={filters.status ?? ALL}
                                options={statusFilterOptions}
                                placeholder="Status"
                                searchPlaceholder="Search status..."
                                onValueChange={(value) => applyFilters(filters, {
                                    status: value === ALL ? undefined : value,
                                    imports_page: undefined,
                                })}
                            />

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => applyFilters(filters, {
                                    status: undefined,
                                    sort_by: 'id',
                                    sort_direction: 'desc',
                                    imports_page: undefined,
                                })}
                            >
                                Clear filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Imports</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('id')}>
                                                ID
                                                <ArrowUpDown className="h-3.5 w-3.5" />
                                            </button>
                                        </TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Uploaded file</TableHead>
                                        <TableHead>Executed by</TableHead>
                                        <TableHead className="text-right">Processed</TableHead>
                                        <TableHead className="text-right">Success</TableHead>
                                        <TableHead className="text-right">Failed</TableHead>
                                        <TableHead className="text-right">Failed imports</TableHead>
                                        <TableHead>
                                            <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort('created_at')}>
                                                Created at
                                                <ArrowUpDown className="h-3.5 w-3.5" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {imports.data.length > 0 ? (
                                        renderTableRows(imports.data)
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                                                No imports found yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {importsMeta.last_page > 1 && (
                            <TablePagination
                                currentPage={importsMeta.current_page}
                                lastPage={importsMeta.last_page}
                                onPageChange={(page) => applyFilters(filters, { imports_page: String(page) })}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ImportsHistoryIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Configuration', href: '#' }, { title: 'Imports', href: '/admin/imports' }]}>
        {page}
    </AppLayout>
);
