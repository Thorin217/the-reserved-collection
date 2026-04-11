import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Copy, FileText, Link2, Loader2, Mail, MessageCircle, Package, Send, Trash2 } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { show as leadShow } from '@/routes/admin/leads';
import {
    destroy as proposalDestroy,
    send as proposalSend,
} from '@/routes/admin/leads/proposals';
import type { Client, Lead, LeadProposal, LeadProposalItem, ProposalStatus } from '@/types';

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

function buildWhatsAppUrl(client: Client | undefined, proposal: LeadProposal, previewUrl: string): string {
    const lines: string[] = [`*${proposal.title}*`, ''];
    for (const item of proposal.items ?? []) {
        lines.push(`• *${item.name}*${item.model ? ` — ${item.model}` : ''}`);
        if (item.description) { lines.push(`  ${item.description}`); }
        lines.push(`  Price: $${Number(item.suggested_price).toLocaleString('en-US')}`);
        lines.push('');
    }
    const total = (proposal.items ?? []).reduce((s, i) => s + Number(i.suggested_price), 0);
    lines.push(`*Total: $${total.toLocaleString('en-US')}*`);
    lines.push('');
    lines.push(`View full proposal: ${previewUrl}`);

    const phone = client?.phone?.replace(/\D/g, '') ?? '';
    const text = encodeURIComponent(lines.join('\n'));
    return `https://wa.me/${phone}?text=${text}`;
}

function SendProposalDialog({ lead, proposal, previewUrl }: { lead: Lead; proposal: LeadProposal; previewUrl: string }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ sent_via: 'whatsapp' as 'whatsapp' | 'email' });
    const client = lead.client;

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (form.data.sent_via === 'whatsapp') {
            window.open(buildWhatsAppUrl(client, proposal, previewUrl), '_blank');
        }

        form.post(proposalSend.url({ lead, proposal }), {
            onSuccess: () => setOpen(false),
        });
    }

    const canSendWhatsApp = !!client?.phone;
    const canSendEmail = !!client?.email;
    const canSend = form.data.sent_via === 'whatsapp' ? canSendWhatsApp : canSendEmail;

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
                    <DialogDescription>Choose how to send this proposal to the client.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => form.setData('sent_via', 'whatsapp')}
                            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${form.data.sent_via === 'whatsapp' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'} ${!canSendWhatsApp ? 'opacity-40' : ''}`}
                        >
                            <MessageCircle className="h-6 w-6 text-green-600" />
                            <span className="text-xs font-medium">WhatsApp</span>
                            {!canSendWhatsApp && <span className="text-[10px] text-muted-foreground">No phone</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => form.setData('sent_via', 'email')}
                            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${form.data.sent_via === 'email' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'} ${!canSendEmail ? 'opacity-40' : ''}`}
                        >
                            <Mail className="h-6 w-6 text-blue-600" />
                            <span className="text-xs font-medium">Email</span>
                            {canSendEmail
                                ? <span className="truncate text-[10px] text-muted-foreground max-w-20">{client?.email}</span>
                                : <span className="text-[10px] text-muted-foreground">No email</span>}
                        </button>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing || !canSend}>
                            {form.data.sent_via === 'whatsapp' ? (
                                <><MessageCircle className="mr-2 h-3.5 w-3.5" />Open WhatsApp</>
                            ) : (
                                <><Mail className="mr-2 h-3.5 w-3.5" />Send email</>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PreviewLinkCard({ url }: { url: string }) {
    const [copied, setCopied] = useState(false);

    function copy() {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                    <Link2 className="h-4 w-4" />
                    Client preview link
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Expires in 7 days. Share this link via WhatsApp or email.</p>
                <div className="flex items-center gap-2">
                    <input
                        readOnly
                        value={url}
                        className="h-8 flex-1 truncate rounded border bg-muted px-2 font-mono text-[10px] text-muted-foreground"
                    />
                    <button
                        type="button"
                        onClick={copy}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded border hover:bg-muted transition-colors"
                        title="Copy link"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

function SendActionsCard({ lead, proposal, previewUrl }: { lead: Lead; proposal: LeadProposal; previewUrl: string }) {
    const client = lead.client;
    const canSendWhatsApp = !!client?.phone;
    const canSendEmail = !!client?.email;

    const whatsAppForm = useForm({ sent_via: 'whatsapp' as const });
    const emailForm = useForm({ sent_via: 'email' as const });

    function sendWhatsApp() {
        window.open(buildWhatsAppUrl(client, proposal, previewUrl), '_blank');
        whatsAppForm.post(proposalSend.url({ lead, proposal }));
    }

    function sendEmail() {
        emailForm.post(proposalSend.url({ lead, proposal }));
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4" />
                    Send proposal
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <button
                    type="button"
                    onClick={sendWhatsApp}
                    disabled={!canSendWhatsApp || whatsAppForm.processing}
                    className="flex w-full items-center gap-3 rounded border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {whatsAppForm.processing ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-green-600" />
                    ) : (
                        <MessageCircle className="h-4 w-4 shrink-0 text-green-600" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">WhatsApp</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                            {canSendWhatsApp ? client?.phone : 'No phone on file'}
                        </p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={sendEmail}
                    disabled={!canSendEmail || emailForm.processing}
                    className="flex w-full items-center gap-3 rounded border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {emailForm.processing ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
                    ) : (
                        <Mail className="h-4 w-4 shrink-0 text-blue-600" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Email</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                            {canSendEmail ? client?.email : 'No email on file'}
                        </p>
                    </div>
                </button>
            </CardContent>
        </Card>
    );
}

function ProposalItemCard({ item }: { item: LeadProposalItem }) {
    const imageUrl = item.product?.image_url;
    return (
        <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                {imageUrl ? (
                    <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                )}
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
    preview_url: string;
};

export default function LeadProposalShow({ lead: { data: lead }, proposal: { data: proposal }, preview_url: previewUrl }: Props) {
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
                            <SendProposalDialog lead={lead} proposal={proposal} previewUrl={previewUrl} />
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
                        <PreviewLinkCard url={previewUrl} />
                        {['draft', 'sent', 'viewed'].includes(proposal.status) && (
                            <SendActionsCard lead={lead} proposal={proposal} previewUrl={previewUrl} />
                        )}
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
