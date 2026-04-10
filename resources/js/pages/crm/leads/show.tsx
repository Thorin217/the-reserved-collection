import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle, Clock, DollarSign, Edit, FileText, Mail, MessageSquare, Phone, Plus, Save, Send, Trash2, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import * as LeadController from '@/actions/App/Http/Controllers/Admin/LeadController';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index as leadsIndex, show as leadShow } from '@/routes/admin/leads';
import { create as proposalCreate, destroy as proposalDestroy, send as proposalSend } from '@/routes/admin/leads/proposals';
import { show as negotiationShow, store as negotiationStore, destroy as negotiationDestroy } from '@/routes/admin/leads/negotiations';
import type { Client, Lead, LeadInteraction, LeadProposal, Negotiation, User } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    new: { label: 'New', variant: 'secondary' },
    contacted: { label: 'Contacted', variant: 'outline' },
    negotiating: { label: 'Negotiating', variant: 'default' },
    won: { label: 'Won', variant: 'default' },
    lost: { label: 'Lost', variant: 'destructive' },
};

const SOURCE_LABELS: Record<string, string> = {
    whatsapp: 'WhatsApp',
    web: 'Web',
    referral: 'Referral',
    social: 'Social media',
    walk_in: 'Walk-in',
    other: 'Other',
};

const INTERACTION_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
    call: { label: 'Call', icon: Phone },
    email: { label: 'Email', icon: Mail },
    visit: { label: 'Visit', icon: UserIcon },
    whatsapp: { label: 'WhatsApp', icon: MessageSquare },
    other: { label: 'Other', icon: Clock },
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
    lead: { data: Lead & { interactions: LeadInteraction[]; proposals: LeadProposal[]; negotiations: Negotiation[] } };
    clients: { data: Client[] };
    users: { data: User[] };
};

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
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <Send className="h-3.5 w-3.5" />
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
                        <Select value={form.data.sent_via} onValueChange={(v) => form.setData('sent_via', v as 'whatsapp' | 'email')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
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

function StartNegotiationDialog({ lead, proposals }: { lead: Lead; proposals: LeadProposal[] }) {
    const [open, setOpen] = useState(false);
    const ALL = '_all';
    const form = useForm({
        lead_proposal_id: '',
        initial_price: '',
        notes: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(negotiationStore.url(lead), {
            onSuccess: () => { setOpen(false); form.reset(); },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Start
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Start negotiation</DialogTitle>
                    <DialogDescription>Set the opening price for this negotiation.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    {proposals.length > 0 && (
                        <div className="space-y-1">
                            <Label>Based on proposal</Label>
                            <Select value={form.data.lead_proposal_id || ALL} onValueChange={(v) => form.setData('lead_proposal_id', v === ALL ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL}>None</SelectItem>
                                    {proposals.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-1">
                        <Label>Initial price *</Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.data.initial_price}
                            onChange={(e) => form.setData('initial_price', e.target.value)}
                            placeholder="0.00"
                            required
                        />
                        {form.errors.initial_price && <p className="text-xs text-destructive">{form.errors.initial_price}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label>Notes</Label>
                        <Textarea value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} rows={2} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={form.processing}>
                            <CheckCircle className="mr-2 h-3.5 w-3.5" />
                            Start negotiation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function LeadShow({ lead: { data: lead }, clients, users }: Props) {
    const [editing, setEditing] = useState(false);

    const editForm = useForm<LeadFormData>({
        client_id: lead.client?.id?.toString() ?? '',
        assigned_to: lead.assigned_user?.id?.toString() ?? '',
        title: lead.title,
        status: lead.status,
        source: lead.source,
        product_interest: lead.product_interest ?? '',
        expected_value: lead.expected_value ?? '',
        notes: lead.notes ?? '',
    });

    const interactionForm = useForm({
        type: 'call',
        notes: '',
    });

    const ALL = '_all';
    const status = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();
        editForm.put(LeadController.update.url(lead), {
            onSuccess: () => setEditing(false),
        });
    }

    function submitInteraction(e: React.FormEvent) {
        e.preventDefault();
        interactionForm.post(`/admin/leads/${lead.id}/interactions`, {
            onSuccess: () => interactionForm.reset(),
        });
    }

    function deleteInteraction(interaction: LeadInteraction) {
        if (!confirm('Delete this interaction?')) { return; }
        router.delete(`/admin/leads/${lead.id}/interactions/${interaction.id}`);
    }

    function deleteLead() {
        if (!confirm(`Delete lead "${lead.title}"? This action cannot be undone.`)) { return; }
        router.delete(LeadController.destroy.url(lead));
    }

    return (
        <>
            <Head title={lead.title} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Link href={leadsIndex()} className="mt-1 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{lead.title}</h1>
                                <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {SOURCE_LABELS[lead.source]} • Created {new Date(lead.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant={editing ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setEditing(!editing)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            {editing ? 'Cancel' : 'Edit'}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={deleteLead}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Left column: Lead details + Edit form */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Lead info / Edit form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{editing ? 'Edit lead' : 'Lead details'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {editing ? (
                                    <form onSubmit={submitEdit} className="space-y-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="title">Title *</Label>
                                            <Input
                                                id="title"
                                                value={editForm.data.title}
                                                onChange={(e) => editForm.setData('title', e.target.value)}
                                                required
                                            />
                                            {editForm.errors.title && <p className="text-xs text-destructive">{editForm.errors.title}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label>Status *</Label>
                                                <Select value={editForm.data.status} onValueChange={(v) => editForm.setData('status', v)}>
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
                                                <Select value={editForm.data.source} onValueChange={(v) => editForm.setData('source', v)}>
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
                                                <Select value={editForm.data.client_id || ALL} onValueChange={(v) => editForm.setData('client_id', v === ALL ? '' : v)}>
                                                    <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={ALL}>No client</SelectItem>
                                                        {clients.data.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Assigned to</Label>
                                                <Select value={editForm.data.assigned_to || ALL} onValueChange={(v) => editForm.setData('assigned_to', v === ALL ? '' : v)}>
                                                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={ALL}>Unassigned</SelectItem>
                                                        {users.data.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Product interest</Label>
                                                <Input value={editForm.data.product_interest} onChange={(e) => editForm.setData('product_interest', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label>Expected value</Label>
                                                <Input type="number" min="0" step="0.01" value={editForm.data.expected_value} onChange={(e) => editForm.setData('expected_value', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Notes</Label>
                                            <Textarea value={editForm.data.notes} onChange={(e) => editForm.setData('notes', e.target.value)} rows={3} />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                                            <Button type="submit" disabled={editForm.processing}>
                                                <Save className="mr-2 h-4 w-4" />
                                                {editForm.processing ? 'Saving...' : 'Save changes'}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                        <div>
                                            <dt className="text-muted-foreground">Client</dt>
                                            <dd className="font-medium mt-0.5">{lead.client?.name ?? '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Assigned to</dt>
                                            <dd className="font-medium mt-0.5">{lead.assigned_user?.name ?? '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Source</dt>
                                            <dd className="font-medium mt-0.5">{SOURCE_LABELS[lead.source] ?? lead.source}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Expected value</dt>
                                            <dd className="font-medium mt-0.5 font-mono">
                                                {lead.expected_value ? `$${Number(lead.expected_value).toLocaleString('en-US')}` : '—'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Product interest</dt>
                                            <dd className="font-medium mt-0.5">{lead.product_interest ?? '—'}</dd>
                                        </div>
                                        {lead.closed_at && (
                                            <div>
                                                <dt className="text-muted-foreground">Closed at</dt>
                                                <dd className="font-medium mt-0.5">
                                                    {new Date(lead.closed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </dd>
                                            </div>
                                        )}
                                        {lead.notes && (
                                            <div className="col-span-2">
                                                <dt className="text-muted-foreground">Notes</dt>
                                                <dd className="mt-0.5 text-foreground whitespace-pre-wrap">{lead.notes}</dd>
                                            </div>
                                        )}
                                    </dl>
                                )}
                            </CardContent>
                        </Card>

                        {/* Log interaction */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Log interaction</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitInteraction} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label>Type *</Label>
                                            <Select value={interactionForm.data.type} onValueChange={(v) => interactionForm.setData('type', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(INTERACTION_TYPE_CONFIG).map(([value, { label }]) => (
                                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Notes *</Label>
                                        <Textarea
                                            value={interactionForm.data.notes}
                                            onChange={(e) => interactionForm.setData('notes', e.target.value)}
                                            placeholder="What happened in this interaction?"
                                            rows={3}
                                            required
                                        />
                                        {interactionForm.errors.notes && <p className="text-xs text-destructive">{interactionForm.errors.notes}</p>}
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" size="sm" disabled={interactionForm.processing}>
                                            {interactionForm.processing ? 'Saving...' : 'Log interaction'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Proposals */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Proposals ({lead.proposals?.length ?? 0})
                                </CardTitle>
                                <Link href={proposalCreate.url(lead)}>
                                    <Button size="sm" variant="outline">
                                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                                        New proposal
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {(!lead.proposals || lead.proposals.length === 0) && (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No proposals yet.</p>
                                )}
                                <div className="space-y-3">
                                    {lead.proposals?.map((proposal, index) => (
                                        <div key={proposal.id}>
                                            {index > 0 && <Separator className="mb-3" />}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-sm">{proposal.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {proposal.items_count ?? 0} items ·{' '}
                                                        {new Date(proposal.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                        {proposal.sent_via && <> · via {proposal.sent_via}</>}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    <Badge variant={
                                                        proposal.status === 'accepted' ? 'default' :
                                                        proposal.status === 'sent' || proposal.status === 'viewed' ? 'outline' :
                                                        proposal.status === 'rejected' ? 'destructive' : 'secondary'
                                                    } className="text-xs">
                                                        {proposal.status}
                                                    </Badge>
                                                    {proposal.status === 'draft' && (
                                                        <SendProposalDialog lead={lead} proposal={proposal} />
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => {
                                                            if (!confirm('Delete this proposal?')) return;
                                                            router.delete(proposalDestroy.url({ lead, proposal }));
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Negotiations */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" />
                                    Negotiations ({lead.negotiations?.length ?? 0})
                                </CardTitle>
                                <StartNegotiationDialog lead={lead} proposals={lead.proposals ?? []} />
                            </CardHeader>
                            <CardContent>
                                {(!lead.negotiations || lead.negotiations.length === 0) && (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No negotiations yet.</p>
                                )}
                                <div className="space-y-3">
                                    {lead.negotiations?.map((negotiation, index) => (
                                        <div key={negotiation.id}>
                                            {index > 0 && <Separator className="mb-3" />}
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-sm font-mono">
                                                        ${Number(negotiation.initial_price).toLocaleString('en-US')}
                                                        {negotiation.final_price && (
                                                            <span className="ml-2 text-green-600">
                                                                → ${Number(negotiation.final_price).toLocaleString('en-US')}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(negotiation.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                        {negotiation.user && <> · {negotiation.user.name}</>}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-1">
                                                    <Badge variant={
                                                        negotiation.status === 'agreed' ? 'default' :
                                                        negotiation.status === 'rejected' ? 'destructive' : 'outline'
                                                    } className="text-xs">
                                                        {negotiation.status === 'agreed' ? 'Agreed' :
                                                         negotiation.status === 'rejected' ? 'Rejected' : 'Negotiating'}
                                                    </Badge>
                                                    <Link href={negotiationShow.url({ lead, negotiation })}>
                                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">View</Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => {
                                                            if (!confirm('Delete this negotiation?')) return;
                                                            router.delete(negotiationDestroy.url({ lead, negotiation }));
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column: Interaction timeline */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    History ({lead.interactions?.length ?? 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(!lead.interactions || lead.interactions.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        No interactions yet. Log the first one.
                                    </p>
                                )}
                                <div className="space-y-4">
                                    {lead.interactions?.map((interaction, index) => {
                                        const typeConfig = INTERACTION_TYPE_CONFIG[interaction.type] ?? INTERACTION_TYPE_CONFIG.other;
                                        const Icon = typeConfig.icon;
                                        return (
                                            <div key={interaction.id}>
                                                {index > 0 && <Separator className="mb-4" />}
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-sm font-medium">{typeConfig.label}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                                                onClick={() => deleteInteraction(interaction)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(interaction.interacted_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            {interaction.user && <> · {interaction.user.name}</>}
                                                        </p>
                                                        <p className="text-sm mt-1.5 text-foreground/80 whitespace-pre-wrap">{interaction.notes}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

LeadShow.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'CRM', href: '#' }, { title: 'Leads', href: leadsIndex() }, { title: 'Detail', href: '#' }]}>
        {page}
    </AppLayout>
);
