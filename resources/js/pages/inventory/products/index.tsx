import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Edit, ListChecks, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import * as ProductSerialController from '@/actions/App/Http/Controllers/Admin/ProductSerialController';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { create as createProduct, index as productsIndex } from '@/routes/admin/products';
import { show as showProductsImport, store as storeProductsImport, template as productsImportTemplate } from '@/routes/admin/products/import';
import type { Brand, Category, PaginatedData, Product } from '@/types';

const ALL = '_all';
const PRODUCT_PRICE_UPDATES_URL = '/admin/products/price-updates';
const IMPORTS_HISTORY_URL = '/admin/imports';

const REQUIRED_IMPORT_COLUMNS = [
    'product_sku',
    'product_name',
    'brand_name*',
    'category_name*',
    'variant_sku',
];

const IMPORT_FIELD_GUIDE = [
    ['product_sku', 'required', 'Unique product SKU.'],
    ['product_name', 'required', 'Product display name.'],
    ['brand_name', 'required*', 'Preferred relation by name. Compared in lowercase, accent-insensitive, exact match after normalization.'],
    ['brand_id', 'optional', 'Integer fallback when brand_name is empty.'],
    ['category_name', 'required*', 'Preferred relation by name. Compared in lowercase, accent-insensitive, exact match after normalization.'],
    ['category_id', 'optional', 'Integer fallback when category_name is empty.'],
    ['description', 'optional', 'Optional product description.'],
    ['product_type', 'optional', 'Allowed: simple, variant, serializable.'],
    ['track_stock', 'optional', 'Boolean: 1/0, true/false.'],
    ['has_serial_numbers', 'optional', 'Boolean: 1/0, true/false.'],
    ['status', 'optional', 'Allowed: draft, active, inactive.'],
    ['variant_sku', 'required', 'Unique variant SKU.'],
    ['variant_cost', 'optional', 'Numeric >= 0.'],
    ['variant_price', 'optional', 'Numeric >= 0.'],
    ['variant_compare_price', 'optional', 'Numeric >= 0.'],
    ['variant_barcode', 'optional', 'Optional barcode text.'],
    ['variant_weight', 'optional', 'Numeric >= 0.'],
    ['variant_is_active', 'optional', 'Boolean: 1/0, true/false.'],
] as const;

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    active: { label: 'Active', variant: 'default' },
    draft: { label: 'Draft', variant: 'secondary' },
    inactive: { label: 'Inactive', variant: 'outline' },
};

const TYPE_LABELS: Record<string, string> = {
    simple: 'Simple',
    variant: 'With variants',
    serializable: 'With serials',
};

const TERMINAL_IMPORT_STATUSES = new Set(['completed', 'completed_with_errors', 'failed']);

type ImportErrorItem = {
    id: number;
    row_number: number | null;
    attribute: string | null;
    value: string | null;
    error_code: string;
    message: string;
};

type ImportRun = {
    id: number;
    status: 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'failed' | string;
    processed_rows: number;
    successful_rows: number;
    failed_rows: number;
    started_at: string | null;
    finished_at: string | null;
    errors: ImportErrorItem[];
};

type ImportStatusResponse = {
    data: ImportRun;
};

type Props = {
    products: PaginatedData<Product>;
    brands: { data: Brand[] };
    categories: { data: Category[] };
    filters: { search?: string; status?: string; brand_id?: string; category_id?: string; page?: string };
};

export default function ProductsIndex({ products, brands, categories, filters }: Props) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [pendingDeleteProduct, setPendingDeleteProduct] = useState<Product | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImportGuideModalOpen, setIsImportGuideModalOpen] = useState(false);
    const [isImportErrorsModalOpen, setIsImportErrorsModalOpen] = useState(false);
    const [currentImportRunId, setCurrentImportRunId] = useState<number | null>(null);
    const [currentImportRun, setCurrentImportRun] = useState<ImportRun | null>(null);
    const [isLoadingImportStatus, setIsLoadingImportStatus] = useState(false);
    const importForm = useForm<{ file: File | null }>({ file: null });

    const importFlash = flash as { import_run_id?: number | null } | undefined;

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(productsIndex(), { ...filters, [key]: resolved }, { preserveState: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    function deleteProduct(product: Product) {
        router.delete(ProductController.destroy.url(product));
    }

    function requestDeleteProduct(product: Product) {
        setPendingDeleteProduct(product);
    }

    function submitImport(event: React.FormEvent): void {
        event.preventDefault();

        importForm.post(storeProductsImport.url(), {
            forceFormData: true,
            onSuccess: () => {
                importForm.reset();
                setIsImportModalOpen(false);
            },
        });
    }

    function confirmDeleteProduct() {
        if (!pendingDeleteProduct) {
            return;
        }

        deleteProduct(pendingDeleteProduct);
        setPendingDeleteProduct(null);
    }

    useEffect(() => {
        if (typeof importFlash?.import_run_id === 'number') {
            setCurrentImportRunId(importFlash.import_run_id);
        }
    }, [importFlash?.import_run_id]);

    useEffect(() => {
        if (!currentImportRunId) {
            return;
        }

        let cancelled = false;
        let intervalId: number | null = null;

        const fetchImportStatus = async () => {
            setIsLoadingImportStatus(true);

            try {
                const response = await window.fetch(showProductsImport.url(currentImportRunId), {
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!response.ok || cancelled) {
                    return;
                }

                const payload = await response.json() as ImportStatusResponse;
                setCurrentImportRun(payload.data);

                if (TERMINAL_IMPORT_STATUSES.has(payload.data.status) && intervalId !== null) {
                    window.clearInterval(intervalId);
                    intervalId = null;
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingImportStatus(false);
                }
            }
        };

        void fetchImportStatus();
        intervalId = window.setInterval(fetchImportStatus, 5000);

        return () => {
            cancelled = true;

            if (intervalId !== null) {
                window.clearInterval(intervalId);
            }
        };
    }, [currentImportRunId]);

    const importStatus = currentImportRun?.status ?? 'pending';
    const importStatusBadge = importStatus === 'completed'
        ? { label: 'Completed', variant: 'default' as const }
        : importStatus === 'completed_with_errors'
            ? { label: 'Completed with errors', variant: 'outline' as const }
            : importStatus === 'failed'
                ? { label: 'Failed', variant: 'outline' as const }
                : importStatus === 'processing'
                    ? { label: 'Processing', variant: 'secondary' as const }
                    : { label: 'Pending', variant: 'secondary' as const };

    return (
        <>
            <Head title="Products" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                {currentImportRunId && (
                    <Card>
                        <CardContent className="space-y-3 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold">Latest import run</p>
                                    <p className="text-xs text-muted-foreground">Run #{currentImportRunId}</p>
                                </div>
                                <Badge variant={importStatusBadge.variant}>{importStatusBadge.label}</Badge>
                            </div>

                            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                                <p>Processed: {currentImportRun?.processed_rows ?? 0}</p>
                                <p>Successful: {currentImportRun?.successful_rows ?? 0}</p>
                                <p>Failed: {currentImportRun?.failed_rows ?? 0}</p>
                            </div>

                            {isLoadingImportStatus && (
                                <p className="text-xs text-muted-foreground">Updating import status...</p>
                            )}

                            {currentImportRun && currentImportRun.errors.length > 0 && (
                                <div className="space-y-1 text-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-foreground">Recent errors</p>
                                        <div className="flex items-center gap-2">
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsImportErrorsModalOpen(true)}>
                                                View all errors
                                            </Button>
                                            <Button type="button" size="sm" className="bg-orange-500 text-white hover:bg-orange-600" asChild>
                                                <Link href={IMPORTS_HISTORY_URL}>View Imports</Link>
                                            </Button>
                                        </div>
                                    </div>
                                    {currentImportRun.errors.slice(0, 5).map((error) => (
                                        <p key={error.id} className="text-muted-foreground">
                                            Row {error.row_number ?? '—'} · {error.message}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Products</h1>
                        <p className="text-sm text-muted-foreground">{products.meta.total} products in inventory</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsImportModalOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import products
                        </Button>

                        <Button asChild size="sm" variant="outline">
                            <Link href={PRODUCT_PRICE_UPDATES_URL}>
                                Update products
                            </Link>
                        </Button>

                        <Button asChild size="sm">
                            <Link href={createProduct()}>
                                <Plus className="mr-2 h-4 w-4" />
                                New product
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by name or SKU..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-64"
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="submit" variant="outline" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Search products</TooltipContent>
                        </Tooltip>
                    </form>
                    <Select value={filters.status ?? ALL} onValueChange={v => applyFilter('status', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filters.brand_id ?? ALL} onValueChange={v => applyFilter('brand_id', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Brand" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All brands</SelectItem>
                            {brands.data.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.category_id ?? ALL} onValueChange={v => applyFilter('category_id', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All categories</SelectItem>
                            {categories.data.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-center">Type</TableHead>
                                    <TableHead className="text-center">Variants</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.map((product) => {
                                    const status = STATUS_LABELS[product.status] ?? STATUS_LABELS.draft;

                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                                            <TableCell>{product.brand?.name ?? '—'}</TableCell>
                                            <TableCell>{product.category?.name ?? '—'}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-xs">{TYPE_LABELS[product.product_type]}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{product.variants_count ?? 0}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    {product.has_serial_numbers && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" asChild>
                                                                    <Link href={ProductSerialController.index.url(product)}>
                                                                        <ListChecks className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>View serials</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" asChild>
                                                                <Link href={ProductController.edit.url(product)}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Edit product</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => requestDeleteProduct(product)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete product</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {products.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                            No products.{' '}
                                            <Link href={createProduct()} className="text-primary underline">Create first product</Link>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {products.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={products.meta.current_page}
                        lastPage={products.meta.last_page}
                        onPageChange={(page) => router.get(productsIndex(), { ...filters, page: String(page) }, { preserveState: true, replace: true })}
                    />
                )}
            </div>

            <ConfirmationModal
                open={!!pendingDeleteProduct}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDeleteProduct(null);
                    }
                }}
                title="Delete product"
                description={pendingDeleteProduct
                    ? `Are you sure you want to delete "${pendingDeleteProduct.name}"? This action cannot be undone.`
                    : ''}
                confirmLabel="Delete product"
                confirmVariant="destructive"
                onConfirm={confirmDeleteProduct}
            />

            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import products and variants</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submitImport} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Download the template, fill product and variant rows, and upload the file. Processing runs in background and you will receive an email when it finishes.
                        </p>

                        <div className="rounded-md border bg-muted/30 p-3 text-xs">
                            <p className="font-semibold text-foreground">Quick legend</p>
                            <p className="mt-2 font-medium text-foreground">Required columns</p>
                            <p className="text-muted-foreground">{REQUIRED_IMPORT_COLUMNS.join(', ')}</p>
                        </div>

                        <Button type="button" variant="outline" asChild>
                            <a href={productsImportTemplate.url()}>
                                Download template (.xlsx)
                            </a>
                        </Button>

                        <div className="space-y-2">
                            <Input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(event) => {
                                    importForm.setData('file', event.target.files?.[0] ?? null);
                                }}
                            />
                            <InputError message={importForm.errors.file} />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsImportGuideModalOpen(true)}>
                                View import guide
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsImportModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={importForm.processing || !importForm.data.file}>
                                    {importForm.processing ? 'Uploading...' : 'Start import'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isImportGuideModalOpen} onOpenChange={setIsImportGuideModalOpen}>
                <DialogContent className="flex h-[85vh] max-h-[85vh] w-[95vw] max-w-5xl flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Import fields guide</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 space-y-3 overflow-auto pr-1 text-sm">
                        <p className="text-muted-foreground">
                            Use this guide to fill the template correctly. * = required by name or ID fallback.
                        </p>

                        <div className="overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-48">Column</TableHead>
                                        <TableHead className="w-32">Requirement</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {IMPORT_FIELD_GUIDE.map(([column, requirement, notes]) => (
                                        <TableRow key={column}>
                                            <TableCell className="font-mono text-xs">{column}</TableCell>
                                            <TableCell>{requirement}</TableCell>
                                            <TableCell className="whitespace-normal">{notes}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                            Example 1: use brand_name/category_name and keep IDs empty. Example 2: use brand_id/category_id integers and keep names empty.
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isImportErrorsModalOpen} onOpenChange={setIsImportErrorsModalOpen}>
                <DialogContent className="h-[90vh] w-[98vw] max-w-[98vw] overflow-hidden sm:max-w-[98vw] lg:max-w-[96vw]">
                    <DialogHeader>
                        <DialogTitle>Import errors</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">Row</TableHead>
                                    <TableHead className="w-40">Attribute</TableHead>
                                    <TableHead className="min-w-56">Value</TableHead>
                                    <TableHead className="w-44">Code</TableHead>
                                    <TableHead>Message</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(currentImportRun?.errors ?? []).map((error) => (
                                    <TableRow key={error.id}>
                                        <TableCell className="align-top">{error.row_number ?? '—'}</TableCell>
                                        <TableCell className="align-top">{error.attribute ?? '—'}</TableCell>
                                        <TableCell className="align-top break-all">{error.value ?? '—'}</TableCell>
                                        <TableCell className="align-top font-mono text-xs">{error.error_code}</TableCell>
                                        <TableCell className="align-top whitespace-normal leading-relaxed">{error.message}</TableCell>
                                    </TableRow>
                                ))}
                                {(currentImportRun?.errors.length ?? 0) === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                                            No errors for this import run.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-end">
                        <Button type="button" variant="ghost" onClick={() => setIsImportErrorsModalOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Inventory', href: '#' }, { title: 'Products', href: productsIndex() }]}>
        {page}
    </AppLayout>
);
