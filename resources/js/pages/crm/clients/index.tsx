import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit, ExternalLink, Plus, Search, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import * as ClientController from '@/actions/App/Http/Controllers/Admin/ClientController';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as clientsIndex } from '@/routes/admin/clients';
import { index as usersIndex } from '@/routes/admin/users';
import type { Client, PaginatedData } from '@/types';

const ALL = '_all';

type Props = {
    clients: PaginatedData<Client>;
    filters: { search?: string; status?: string; page?: string };
};

type ClientFormData = {
    name: string;
    email: string;
    phone: string;
    document_type: string;
    document_number: string;
    address: string;
    notes: string;
};

function ClientFormDialog({
    trigger,
    title,
    defaultValues,
    onSubmit,
}: {
    trigger: React.ReactNode;
    title: string;
    defaultValues?: Partial<ClientFormData>;
    onSubmit: (data: ClientFormData, close: () => void) => void;
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, errors, reset } = useForm<ClientFormData>({
        name: defaultValues?.name ?? '',
        email: defaultValues?.email ?? '',
        phone: defaultValues?.phone ?? '',
        document_type: defaultValues?.document_type ?? '',
        document_number: defaultValues?.document_number ?? '',
        address: defaultValues?.address ?? '',
        notes: defaultValues?.notes ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(data, () => {
            setOpen(false);
            reset();
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Fill in the client details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="document_type">Document type</Label>
                            <Select value={data.document_type} onValueChange={(v) => setData('document_type', v)}>
                                <SelectTrigger id="document_type">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rut">RUT</SelectItem>
                                    <SelectItem value="passport">Passport</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="document_number">Document number</Label>
                            <Input id="document_number" value={data.document_number} onChange={(e) => setData('document_number', e.target.value)} />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="notes">Notes</Label>
                            <Input id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ClientsIndex({ clients, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [pendingDeleteClient, setPendingDeleteClient] = useState<Client | null>(null);

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(clientsIndex(), { ...filters, [key]: resolved }, { preserveState: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    function handleStore(data: ClientFormData, close: () => void) {
        router.post(ClientController.store.url(), data, { onSuccess: close });
    }

    function handleUpdate(client: Client, data: ClientFormData, close: () => void) {
        router.put(ClientController.update.url(client), data, { onSuccess: close });
    }

    function deleteClient(client: Client) {
        router.delete(ClientController.destroy.url(client));
    }

    function requestDeleteClient(client: Client) {
        setPendingDeleteClient(client);
    }

    function confirmDeleteClient() {
        if (!pendingDeleteClient) {
            return;
        }

        deleteClient(pendingDeleteClient);
        setPendingDeleteClient(null);
    }

    return (
        <>
            <Head title="Clients" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Clients</h1>
                        <p className="text-sm text-muted-foreground">{clients.meta.total} clients registered</p>
                    </div>
                    <ClientFormDialog
                        title="New client"
                        trigger={
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                New client
                            </Button>
                        }
                        onSubmit={handleStore}
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by name, email or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-72"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                    <Select value={filters.status ?? ALL} onValueChange={(v) => applyFilter('status', v)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Document</TableHead>
                                    <TableHead className="text-center">Leads</TableHead>
                                    <TableHead>User account</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.data.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={ClientController.show.url(client)}
                                                className="font-medium hover:underline"
                                            >
                                                {client.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{client.email ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground">{client.phone ?? '—'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {client.document_type && client.document_number
                                                ? `${client.document_type.toUpperCase()}: ${client.document_number}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-center">{client.leads_count ?? 0}</TableCell>
                                        <TableCell>
                                            {client.user ? (
                                                <Link
                                                    href={usersIndex.url({ query: { search: client.user.name } })}
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                                                >
                                                    {client.user.name}
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {client.is_active ? (
                                                <Badge variant="default" className="gap-1">
                                                    <UserCheck className="h-3 w-3" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="gap-1">
                                                    <UserX className="h-3 w-3" />
                                                    Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <ClientFormDialog
                                                    title="Edit client"
                                                    defaultValues={{
                                                        name: client.name,
                                                        email: client.email ?? '',
                                                        phone: client.phone ?? '',
                                                        document_type: client.document_type ?? '',
                                                        document_number: client.document_number ?? '',
                                                        address: client.address ?? '',
                                                        notes: client.notes ?? '',
                                                    }}
                                                    trigger={
                                                        <Button variant="ghost" size="icon" title="Edit">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                    onSubmit={(data, close) => handleUpdate(client, data, close)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => requestDeleteClient(client)}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {clients.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                            No clients registered.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {clients.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={clients.meta.current_page}
                        lastPage={clients.meta.last_page}
                        onPageChange={(page) => router.get(clientsIndex(), { ...filters, page: String(page) }, { preserveState: true, replace: true })}
                    />
                )}

                <ConfirmationModal
                    open={!!pendingDeleteClient}
                    onOpenChange={(open) => {
                        if (!open) {
                            setPendingDeleteClient(null);
                        }
                    }}
                    title="Delete client"
                    description={pendingDeleteClient
                        ? `Are you sure you want to delete "${pendingDeleteClient.name}"? This action cannot be undone.`
                        : 'Are you sure you want to delete this client?'}
                    confirmLabel="Delete"
                    confirmVariant="destructive"
                    onConfirm={confirmDeleteClient}
                />
            </div>
        </>
    );
}

ClientsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'CRM', href: '#' }, { title: 'Clients', href: clientsIndex() }]}>
        {page}
    </AppLayout>
);
