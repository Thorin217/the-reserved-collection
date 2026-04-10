import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, FileText, Package, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { show as leadShow } from '@/routes/admin/leads';
import {
    destroy as proposalDestroy,
    send as proposalSend,
} from '@/routes/admin/leads/proposals';
import type { Lead, LeadProposal, LeadProposalItem, ProposalStatus } from '@/types';

const PROPOSAL_STATUS_CONFIG: Record<ProposalStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    sent: { label: 'Sent', variant: 'outline' },
    viewed: { label: 'Viewed', variant: 'outline' },
    accepted: { label: 'Accepted', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

function fmt(amount: string | null | undefined): string {
    if (!amount) return '—';
    return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function SendProposalDialog({ lead, proposal }: { lead: Lead; proposal: LeadProposal }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ sent_via: 'whatsapp' as 'whatsapp' | 'email' });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(proposalSend.url({ lead, proposal }), {
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Send proposal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>Send proposal</DialogTitle>
                    <DialogDescription>How will you send this proposal?</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <Label>Send via *</Label>
                        <Select
                            value={form.data.sent_via}
                            onValueChange={(v) => form.setData('sent_via', v as 'whatsapp' | 'email')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            <Send className="mr-2 h-3.5 w-3.5" />
                            Mark as sent
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ProposalItemCard({ item }: { item: LeadProposalItem }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        {item.model && (
                            <p className="text-sm text-muted-foreground">{item.model}</p>
                        )}
                        {item.product?.brand && (
                            <p className="text-xs text-muted-foreground">{item.product.brand.name}</p>
                        )}
                    </div>
                    <p className="shrink-0 font-mono text-base font-semibold">
                        {fmt(item.suggested_price)}
                    </p>
                </div>
                {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                {item.notes && (
                    <p className="rounded bg-muted px-2 py-1 text-sm italic text-muted-foreground">
                        Note: {item.notes}
                    </p>
                )}
                {item.serial && (
                    <p className="text-xs text-muted-foreground">
                        Serial: <span className="font-mono">{item.serial.serial_number}</span>
                    </p>
                )}
            </div>
        </div>
    );
}

type Props = {
    lead: { data: Lead };
    proposal: { data: LeadProposal };
};

export default function LeadProposalShow({ lead: { data: lead }, proposal: { data: proposal } }: Props) {
    const statusConf = PROPOSAL_STATUS_CONFIG[proposal.status] ?? PROPOSAL_STATUS_CONFIG.draft;

    const totalSuggested = (proposal.items ?? []).reduce(
        (sum, item) => sum + (parseFloat(item.suggested_price) || 0),
        0,
    );

    function deleteProposal() {
        if (!confirm('Delete this proposal? This action cannot be undone.')) return;
        router.delete(proposalDestroy.url({ lead, proposal }));
    }

    return (
        <>
            <Head title={`${proposal.title} — ${lead.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Link href={leadShow.url(lead)} className="mt-1 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{proposal.title}</h1>
                                <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Lead: {lead.title}
                                {proposal.user && <> · Created by {proposal.user.name}</>}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {proposal.status === 'draft' && (
                            <SendProposalDialog lead={lead} proposal={proposal} />
                        )}
                        <Button variant="destructive" size="sm" onClick={deleteProposal}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Main: items */}
                    <div className="space-y-4 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Products ({(proposal.items ?? []).length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(!proposal.items || proposal.items.length === 0) && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No items in this proposal.
                                    </p>
                                )}
                                <div className="space-y-4">
                                    {proposal.items?.map((item, index) => (
                                        <div key={item.id}>
                                            {index > 0 && <Separator className="mb-4" />}
                                            <ProposalItemCard item={item} />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {proposal.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap text-sm">{proposal.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar: summary */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={statusConf.variant} className="text-xs">
                                        {statusConf.label}
                                    </Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Items</span>
                                    <span className="font-medium">{(proposal.items ?? []).length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total suggested</span>
                                    <span className="font-mono font-semibold">{fmt(totalSuggested.toFixed(2))}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created</span>
                                    <span>
                                        {new Date(proposal.created_at).toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                                {proposal.sent_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sent</span>
                                        <span>
                                            {new Date(proposal.sent_at).toLocaleDateString('en-US', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                )}
                                {proposal.sent_via && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sent via</span>
                                        <span className="capitalize">{proposal.sent_via}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

LeadProposalShow.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
