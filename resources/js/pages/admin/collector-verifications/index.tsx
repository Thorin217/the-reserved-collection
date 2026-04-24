import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, Clock, Shield, X } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index as verificationsIndex, approve, reject } from '@/routes/admin/collector-verifications';
import type { CollectorVerificationRequest, PaginatedData } from '@/types';

const ALL = '_all';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: 'Pending', variant: 'secondary' },
    approved: { label: 'Approved', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

type RejectDialogProps = {
    request: CollectorVerificationRequest;
    onClose: () => void;
};

function RejectDialog({ request, onClose }: RejectDialogProps) {
    const { data, setData, post, processing, errors } = useForm({ admin_notes: '' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(reject.url(request), { onSuccess: onClose });
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Reject Verification</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                    Rejecting <strong>{request.user?.name}</strong>. Please provide a reason.
                </p>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin_notes">Reason for rejection</Label>
                        <Textarea
                            id="admin_notes"
                            value={data.admin_notes}
                            onChange={(e) => setData('admin_notes', e.target.value)}
                            placeholder="Explain why this request is being rejected..."
                            rows={4}
                        />
                        {errors.admin_notes && <p className="text-sm text-destructive">{errors.admin_notes}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            {processing ? 'Rejecting…' : 'Reject'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

type Props = {
    requests: PaginatedData<CollectorVerificationRequest>;
    filters: { filter?: { status?: string } };
};

export default function CollectorVerificationsIndex({ requests, filters }: Props) {
    const [rejectTarget, setRejectTarget] = useState<CollectorVerificationRequest | null>(null);
    const active = filters.filter ?? {};

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(verificationsIndex(), { filter: { ...active, [key]: resolved } }, { preserveState: true, replace: true });
    }

    function handleApprove(req: CollectorVerificationRequest) {
        if (!confirm(`Approve ${req.user?.name} as a verified collector?`)) return;
        router.post(approve.url(req));
    }

    return (
        <>
            <Head title="Collector Verifications" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Collector Verifications</h1>
                        <p className="text-sm text-muted-foreground">Review and approve collector access requests</p>
                    </div>
                </div>

                {/* Filter */}
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Admin Notes</TableHead>
                                    <TableHead>Reviewed by</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.data.map((req) => {
                                    const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
                                    return (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-medium">{req.user?.name ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{req.user?.email ?? '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                                {req.message ?? '—'}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                                {req.admin_notes ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {req.reviewer?.name ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {req.status === 'pending' && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => handleApprove(req)}
                                                        >
                                                            <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => setRejectTarget(req)}
                                                        >
                                                            <X className="mr-1 h-3.5 w-3.5" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {requests.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                            No verification requests found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {requests.meta.last_page > 1 && (
                    <TablePagination
                        currentPage={requests.meta.current_page}
                        lastPage={requests.meta.last_page}
                        onPageChange={(page) =>
                            router.get(verificationsIndex(), { filter: active, page: String(page) }, { preserveState: true, replace: true })
                        }
                    />
                )}
            </div>

            {rejectTarget && <RejectDialog request={rejectTarget} onClose={() => setRejectTarget(null)} />}
        </>
    );
}

CollectorVerificationsIndex.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Collector Verifications', href: verificationsIndex() },
        ]}
    >
        {page}
    </AppLayout>
);
