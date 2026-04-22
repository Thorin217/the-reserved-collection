import { Head, Link, router } from '@inertiajs/react';
import { Edit, Plus } from 'lucide-react';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import {
    destroy as destroyVendor,
    edit as editVendor,
    index as vendorsIndex,
} from '@/routes/admin/finance/vendors';
import { create as createPayable, show as payableShow } from '@/routes/admin/finance/payables';
import { useState } from 'react';

const STATUS_CONFIG: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
    pending: { label: 'Pending', variant: 'secondary' },
    partial: { label: 'Partial', variant: 'outline' },
    paid: { label: 'Paid', variant: 'default' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
};

type PayableRow = {
    id: number;
    reference: string | null;
    status: string;
    due_date: string | null;
    amount: string;
    paid_amount: string;
    balance_due: string;
};

type VendorData = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    tax_id: string | null;
    contact_person: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    payables_count?: number;
};

type Props = {
    vendor: { data: VendorData };
    payables: { data: PayableRow[] };
};

export default function FinanceVendorsShow({ vendor: { data: vendor }, payables }: Props) {
    const [deleteOpen, setDeleteOpen] = useState(false);

    return (
        <>
            <Head title={vendor.name} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">{vendor.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            Vendor profile and payment obligations.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={editVendor.url(vendor.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteOpen(true)}
                        >
                            Delete
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link href={vendorsIndex()}>Back to vendors</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-sm">
                            {vendor.email && <p>{vendor.email}</p>}
                            {vendor.phone && <p>{vendor.phone}</p>}
                            {vendor.contact_person && (
                                <p className="text-muted-foreground">{vendor.contact_person}</p>
                            )}
                            {!vendor.email && !vendor.phone && (
                                <p className="text-muted-foreground">No contact info</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Tax ID</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <p className="font-mono">{vendor.tax_id ?? '—'}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                                {vendor.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>

                {vendor.address && (
                    <p className="text-sm text-muted-foreground">{vendor.address}</p>
                )}

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Payment obligations</h2>
                    <Button asChild size="sm">
                        <Link href={`${createPayable()}?vendor_id=${vendor.id}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Register payable
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Paid</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payables.data.map((payable) => {
                                    const status = STATUS_CONFIG[payable.status] ?? STATUS_CONFIG.pending;
                                    return (
                                        <TableRow
                                            key={payable.id}
                                            className="cursor-pointer"
                                            onClick={() => router.visit(payableShow.url(payable.id))}
                                        >
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={payableShow.url(payable.id)}
                                                    className="hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {payable.reference ?? `#${payable.id}`}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {payable.due_date
                                                    ? new Date(payable.due_date).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(payable.amount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(payable.paid_amount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(payable.balance_due)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {payables.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No payables registered for this vendor.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <ConfirmationModal
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete vendor"
                description={`Are you sure you want to delete ${vendor.name}? This cannot be undone.`}
                confirmLabel="Delete"
                confirmVariant="destructive"
                onConfirm={() => {
                    router.delete(destroyVendor.url(vendor.id));
                    setDeleteOpen(false);
                }}
            />
        </>
    );
}

FinanceVendorsShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Vendors', href: vendorsIndex() },
            { title: 'Detail', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
