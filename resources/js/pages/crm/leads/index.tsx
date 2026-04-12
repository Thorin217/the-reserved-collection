import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import * as LeadController from '@/actions/App/Http/Controllers/Admin/LeadController';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index as leadsIndex, show as leadShow } from '@/routes/admin/leads';
import type { Client, Lead, PaginatedData, User } from '@/types';

const ALL = '_all';

export const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    new: { label: 'New', variant: 'secondary' },
    contacted: { label: 'Contacted', variant: 'outline' },
    negotiating: { label: 'Negotiating', variant: 'default' },
    won: { label: 'Won', variant: 'default' },
    lost: { label: 'Lost', variant: 'destructive' },
};

export const SOURCE_LABELS: Record<string, string> = {
    whatsapp: 'WhatsApp',
    web: 'Web',
    referral: 'Referral',
    social: 'Social media',
    walk_in: 'Walk-in',
    other: 'Other',
};

type LeadFormData = {
    client_id: string;
    assigned_to: string;
    title: string;
    status: string;
    source: string;
    product_interest: string;
    expected_value: string;
    notes: string;
};

type Props = {
    leads: PaginatedData<Lead>;
    clients: { data: Client[] };
    users: { data: User[] };
    filters: { search?: string; status?: string; source?: string; assigned_to?: string; page?: string };
};

function NewLeadDialog({ clients, users, onSubmit }: { clients: Client[]; users: User[]; onSubmit: (data: LeadFormData, close: () => void) => void }) {
    const [open, setOpen] = useState(false);
    const { data, setData, errors, reset } = useForm<LeadFormData>({
        client_id: '',
        assigned_to: '',
        title: '',
        status: 'new',
        source: 'other',
        product_interest: '',
        expected_value: '',
        notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit(data, () => { setOpen(false); reset(); });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New lead
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>New lead</DialogTitle>
                    <DialogDescription>Fill in the lead details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                        </div>
                        <div className="space-y-1">
                            <Label>Status *</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Source *</Label>
                            <Select value={data.source} onValueChange={(v) => setData('source', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Client</Label>
                            <Select value={data.client_id || ALL} onValueChange={(v) => setData('client_id', v === ALL ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>No client</SelectItem>
                                    {clients.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Assigned to</Label>
                            <Select value={data.assigned_to || ALL} onValueChange={(v) => setData('assigned_to', v === ALL ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>Unassigned</SelectItem>
                                    {users.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Product interest</Label>
                            <Input value={data.product_interest} onChange={(e) => setData('product_interest', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label>Expected value</Label>
                            <Input type="number" min="0" step="0.01" value={data.expected_value} onChange={(e) => setData('expected_value', e.target.value)} />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label>Notes</Label>
                            <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit">Create lead</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function LeadsIndex({ leads, clients, users, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(leadsIndex(), { ...filters, [key]: resolved }, { preserveState: true, replace: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    function handleStore(data: LeadFormData, close: () => void) {
        router.post(LeadController.store.url(), data, { onSuccess: close });
    }

    return (
        <>
            <Head title="Leads" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Leads</h1>
                        <p className="text-sm text-muted-foreground">{leads.meta.total} leads in pipeline</p>
                    </div>
                    <NewLeadDialog clients={clients.data} users={users.data} onSubmit={handleStore} />
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by title or client..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                    <Select value={filters.status ?? ALL} onValueChange={(v) => applyFilter('status', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All statuses</SelectItem>
                            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.source ?? ALL} onValueChange={(v) => applyFilter('source', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Source" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All sources</SelectItem>
                            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.assigned_to ?? ALL} onValueChange={(v) => applyFilter('assigned_to', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Assigned to" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All</SelectItem>
                            {users.data.map((u) => (
                                <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Title</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Interest</TableHead>
                                    <TableHead className="text-right">Expected value</TableHead>
                                    <TableHead>Assigned to</TableHead>
                                    <TableHead className="text-center">Interactions</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.data.map((lead) => {
                                    const status = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
                                    return (
                                        <TableRow key={lead.id} className="cursor-pointer" onClick={() => router.visit(leadShow(lead))}>
                                            <TableCell className="font-medium">{lead.title}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {lead.client?.name ?? <span className="italic text-muted-foreground/50">No client</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {SOURCE_LABELS[lead.source] ?? lead.source}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {lead.product_interest ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {lead.expected_value
                                                    ? `$${Number(lead.expected_value).toLocaleString('en-US')}`
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {lead.assigned_user?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {lead.interactions_count ?? 0}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end">
                                                    <Button variant="ghost" size="icon" asChild title="View detail">
                                                        <Link href={leadShow(lead)}>
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {leads.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                                            No leads registered.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {leads.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={leads.meta.current_page}
                        lastPage={leads.meta.last_page}
                        onPageChange={(page) => router.get(leadsIndex(), { ...filters, page: String(page) }, { preserveState: true, replace: true })}
                    />
                )}
            </div>
        </>
    );
}

LeadsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'CRM', href: '#' }, { title: 'Leads', href: leadsIndex() }]}>
        {page}
    </AppLayout>
);
