import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { index as negotiationsIndex, show as negotiationShow } from '@/routes/admin/product-negotiations';
import type { PaginatedData, ProductNegotiation } from '@/types';

const ALL = '_all';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: 'Pending Review', variant: 'secondary' },
    active: { label: 'Active', variant: 'default' },
    agreed: { label: 'Agreed', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'outline' },
};

function fmt(value: string | null): string {
    if (!value) return '—';
    return formatCurrency(value);
}

type Props = {
    negotiations: PaginatedData<ProductNegotiation>;
    filters: { filter?: { status?: string } };
};

export default function ProductNegotiationsIndex({ negotiations, filters }: Props) {
    const active = filters.filter ?? {};

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(negotiationsIndex(), { filter: { ...active, [key]: resolved } }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Portal Negotiations" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div>
                    <h1 className="text-2xl font-bold">Portal Negotiations</h1>
                    <p className="text-sm text-muted-foreground">Price negotiations initiated by verified collectors</p>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={active.status ?? ALL}
                        onValueChange={(v) => applyFilter('status', v)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All statuses</SelectItem>
                            <SelectItem value="pending">Pending Review</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="agreed">Agreed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Collector</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Initial Offer</TableHead>
                                    <TableHead className="text-right">Final Price</TableHead>
                                    <TableHead className="text-center">Messages</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {negotiations.data.map((neg) => {
                                    const status = STATUS_CONFIG[neg.status] ?? STATUS_CONFIG.pending;
                                    return (
                                        <TableRow
                                            key={neg.id}
                                            className="cursor-pointer"
                                            onClick={() => router.visit(negotiationShow.url(neg))}
                                        >
                                            <TableCell className="font-medium">
                                                <div>
                                                    {neg.product?.brand && (
                                                        <p className="text-xs text-muted-foreground">{neg.product.brand.name}</p>
                                                    )}
                                                    <p className="text-sm">{neg.product?.name ?? '—'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {neg.user?.name ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {fmt(neg.initial_offer)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {fmt(neg.final_price)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                    {neg.messages_count ?? 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(neg.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end">
                                                    <Button variant="ghost" size="icon" asChild title="View negotiation">
                                                        <Link href={negotiationShow.url(neg)}>
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {negotiations.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                            No negotiations found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {negotiations.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={negotiations.meta.current_page}
                        lastPage={negotiations.meta.last_page}
                        onPageChange={(page) =>
                            router.get(negotiationsIndex(), { filter: active, page: String(page) }, { preserveState: true, replace: true })
                        }
                    />
                )}
            </div>
        </>
    );
}

ProductNegotiationsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Portal Negotiations', href: negotiationsIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
