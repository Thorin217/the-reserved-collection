import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { index as negotiationsIndex } from '@/routes/admin/negotiations';
import { show as negotiationShow } from '@/routes/admin/leads/negotiations';
import { show as leadShow } from '@/routes/admin/leads';
import type { Negotiation, PaginatedData, User } from '@/types';

const ALL = '_all';

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'outline' | 'destructive';
    }
> = {
    negotiating: { label: 'Negotiating', variant: 'secondary' },
    agreed: { label: 'Agreed', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

function formatPrice(value: string | null): string {
    if (!value) {
        return '—';
    }

    return formatCurrency(value);
}

type Filters = {
    filter?: {
        status?: string;
        user_id?: string;
    };
    page?: string;
};

type Props = {
    negotiations: PaginatedData<Negotiation>;
    users: { data: User[] };
    filters: Filters;
};

export default function NegotiationsIndex({
    negotiations,
    users,
    filters,
}: Props) {
    const active = filters.filter ?? {};

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(
            negotiationsIndex(),
            { filter: { ...active, [key]: resolved } },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Negotiations" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Negotiations</h1>
                        <p className="text-sm text-muted-foreground">
                            {negotiations.meta.total} negotiations total
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Select
                        value={active.status ?? ALL}
                        onValueChange={(v) => applyFilter('status', v)}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All statuses</SelectItem>
                            {Object.entries(STATUS_CONFIG).map(
                                ([value, { label }]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>

                    <Select
                        value={active.user_id ?? ALL}
                        onValueChange={(v) => applyFilter('user_id', v)}
                    >
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Assigned to" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>All users</SelectItem>
                            {users.data.map((u) => (
                                <SelectItem key={u.id} value={u.id.toString()}>
                                    {u.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Lead</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Initial price
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Final price
                                    </TableHead>
                                    <TableHead>Proposal</TableHead>
                                    <TableHead>Assigned to</TableHead>
                                    <TableHead className="text-center">
                                        Offers
                                    </TableHead>
                                    <TableHead>Agreed at</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {negotiations.data.map((negotiation) => {
                                    const status =
                                        STATUS_CONFIG[negotiation.status] ??
                                        STATUS_CONFIG.negotiating;
                                    return (
                                        <TableRow
                                            key={negotiation.id}
                                            className={
                                                negotiation.lead
                                                    ? 'cursor-pointer'
                                                    : undefined
                                            }
                                            onClick={() =>
                                                negotiation.lead &&
                                                router.visit(
                                                    negotiationShow({
                                                        lead: negotiation.lead,
                                                        negotiation,
                                                    }),
                                                )
                                            }
                                        >
                                            <TableCell className="font-medium">
                                                {negotiation.lead ? (
                                                    <Link
                                                        href={leadShow(
                                                            negotiation.lead,
                                                        )}
                                                        className="text-primary underline-offset-4 hover:underline"
                                                    >
                                                        {negotiation.lead.title}
                                                    </Link>
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {negotiation.lead?.client
                                                    ?.name ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {formatPrice(
                                                    negotiation.initial_price,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {formatPrice(
                                                    negotiation.final_price,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {negotiation.proposal?.title ??
                                                    '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {negotiation.user?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                {negotiation.offers_count ?? 0}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {negotiation.agreed_at
                                                    ? new Date(
                                                          negotiation.agreed_at,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </TableCell>
                                            <TableCell
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="flex items-center justify-end">
                                                    {negotiation.lead && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            asChild
                                                            title="View negotiation"
                                                        >
                                                            <Link
                                                                href={negotiationShow(
                                                                    {
                                                                        lead: negotiation.lead,
                                                                        negotiation,
                                                                    },
                                                                )}
                                                            >
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {negotiations.data.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={10}
                                            className="py-8 text-center text-muted-foreground"
                                        >
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
                            router.get(
                                negotiationsIndex(),
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

NegotiationsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'CRM', href: '#' },
            { title: 'Negotiations', href: negotiationsIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
