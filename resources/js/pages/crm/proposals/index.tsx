import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as proposalsIndex } from '@/routes/admin/proposals';
import { show as proposalShow } from '@/routes/admin/leads/proposals';
import { show as leadShow } from '@/routes/admin/leads';
import type { LeadProposal, PaginatedData, User } from '@/types';

const ALL = '_all';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    sent: { label: 'Sent', variant: 'outline' },
    viewed: { label: 'Viewed', variant: 'outline' },
    accepted: { label: 'Accepted', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

const SENT_VIA_LABELS: Record<string, string> = {
    whatsapp: 'WhatsApp',
    email: 'Email',
};

type Filters = {
    filter?: {
        search?: string;
        status?: string;
        sent_via?: string;
        user_id?: string;
    };
    page?: string;
};

type Props = {
    proposals: PaginatedData<LeadProposal>;
    users: { data: User[] };
    filters: Filters;
};

export default function ProposalsIndex({ proposals, users, filters }: Props) {
    const active = filters.filter ?? {};
    const [search, setSearch] = useState(active.search ?? '');

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(
            proposalsIndex(),
            { filter: { ...active, [key]: resolved } },
            { preserveState: true, replace: true },
        );
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilter('search', search);
    }

    return (
        <>
            <Head title="Proposals" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Proposals</h1>
                        <p className="text-sm text-muted-foreground">{proposals.meta.total} proposals total</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Search by title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>

                    <Select value={active.status ?? ALL} onValueChange={(v) => applyFilter('status', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All statuses</SelectItem>
                            {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={active.sent_via ?? ALL} onValueChange={(v) => applyFilter('sent_via', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Sent via" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All channels</SelectItem>
                            {Object.entries(SENT_VIA_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={active.user_id ?? ALL} onValueChange={(v) => applyFilter('user_id', v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Created by" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All users</SelectItem>
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
                                    <TableHead>Lead</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Sent via</TableHead>
                                    <TableHead>Sent at</TableHead>
                                    <TableHead>Created by</TableHead>
                                    <TableHead className="text-center">Items</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {proposals.data.map((proposal) => {
                                    const status = STATUS_CONFIG[proposal.status] ?? STATUS_CONFIG.draft;
                                    return (
                                        <TableRow
                                            key={proposal.id}
                                            className={proposal.lead ? 'cursor-pointer' : undefined}
                                            onClick={() => proposal.lead && router.visit(proposalShow({ lead: proposal.lead, proposal }))}
                                        >
                                            <TableCell className="font-medium">{proposal.title}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {proposal.lead ? (
                                                    <Link
                                                        href={leadShow(proposal.lead)}
                                                        className="text-primary underline-offset-4 hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {proposal.lead.title}
                                                    </Link>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {proposal.lead?.client?.name ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {proposal.sent_via ? SENT_VIA_LABELS[proposal.sent_via] : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {proposal.sent_at
                                                    ? new Date(proposal.sent_at).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {proposal.user?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {proposal.items_count ?? 0}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end">
                                                    {proposal.lead && (
                                                        <Button variant="ghost" size="icon" asChild title="View proposal">
                                                            <Link href={proposalShow({ lead: proposal.lead, proposal })}>
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {proposals.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                                            No proposals found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {proposals.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={proposals.meta.current_page}
                        lastPage={proposals.meta.last_page}
                        onPageChange={(page) => router.get(proposalsIndex(), { filter: active, page: String(page) }, { preserveState: true, replace: true })}
                    />
                )}
            </div>
        </>
    );
}

ProposalsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'CRM', href: '#' }, { title: 'Proposals', href: proposalsIndex() }]}>
        {page}
    </AppLayout>
);
