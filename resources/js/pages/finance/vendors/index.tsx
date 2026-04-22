import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import {
    create as createVendor,
    index as vendorsIndex,
    show as vendorShow,
} from '@/routes/admin/finance/vendors';
import type { PaginatedData } from '@/types';

type VendorRow = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    tax_id: string | null;
    contact_person: string | null;
    is_active: boolean;
    payables_count?: number;
};

type Props = {
    vendors: PaginatedData<VendorRow>;
    metrics: { total_count: number; active_count: number };
    filters: { filter?: { search?: string } };
};

export default function FinanceVendorsIndex({ vendors, metrics, filters }: Props) {
    const active = filters.filter ?? {};
    const [search, setSearch] = useState(active.search ?? '');

    function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            vendorsIndex(),
            { filter: { search: search || undefined } },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Vendors" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Vendors</h1>
                        <p className="text-sm text-muted-foreground">
                            Supplier registry and contact information.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={createVendor()}>
                            <Plus className="mr-2 h-4 w-4" />
                            New vendor
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Total vendors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{metrics.total_count}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Active vendors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold">{metrics.active_count}</p>
                        </CardContent>
                    </Card>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Search by name, email or tax ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-72"
                    />
                    <Button type="submit" variant="outline" size="icon">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Tax ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Payables</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vendors.data.map((vendor) => (
                                    <TableRow
                                        key={vendor.id}
                                        className="cursor-pointer"
                                        onClick={() => router.visit(vendorShow.url(vendor.id))}
                                    >
                                        <TableCell className="font-medium">
                                            <Link
                                                href={vendorShow.url(vendor.id)}
                                                className="hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {vendor.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {vendor.email ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {vendor.phone ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {vendor.tax_id ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                                                {vendor.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {vendor.payables_count ?? 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {vendors.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No vendors registered yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {vendors.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={vendors.meta.current_page}
                        lastPage={vendors.meta.last_page}
                        onPageChange={(page) =>
                            router.get(
                                vendorsIndex(),
                                { filter: active, page: String(page) },
                                { preserveState: true, replace: true },
                            )
                        }
                    />
                )}
            </div>
        </>
    );
}

FinanceVendorsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Vendors', href: vendorsIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
