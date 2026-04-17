import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Edit,
    FileText,
    Mail,
    MapPin,
    Phone,
    ShoppingCart,
    TrendingUp,
    User as UserIcon,
    UserCheck,
    UserX,
} from 'lucide-react';
import { useState } from 'react';
import * as ClientController from '@/actions/App/Http/Controllers/Admin/ClientController';
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
import AppLayout from '@/layouts/app-layout';
import { index as clientsIndex } from '@/routes/admin/clients';
import { index as leadsIndex } from '@/routes/admin/leads';
import { index as usersIndex } from '@/routes/admin/users';
import type { Client } from '@/types';

const LEAD_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
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

type ClientFormData = {
    name: string;
    email: string;
    phone: string;
    document_type: string;
    document_number: string;
    address: string;
    notes: string;
    is_active: string;
};

type Props = {
    client: { data: Client };
};

function EditClientDialog({ client }: { client: Client }) {
    const [open, setOpen] = useState(false);
    const { data, setData, errors, reset } = useForm<ClientFormData>({
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        document_type: client.document_type ?? '',
        document_number: client.document_number ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
        is_active: client.is_active ? '1' : '0',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.put(
            ClientController.update.url(client),
            { ...data, is_active: data.is_active === '1' },
            {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit client
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit client</DialogTitle>
                    <DialogDescription>Update the client's information.</DialogDescription>
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
                            <Input
                                id="document_number"
                                value={data.document_number}
                                onChange={(e) => setData('document_number', e.target.value)}
                            />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="notes">Notes</Label>
                            <Input id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label htmlFor="is_active">Status</Label>
                            <Select value={data.is_active} onValueChange={(v) => setData('is_active', v)}>
                                <SelectTrigger id="is_active">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="0">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ClientShow({ client: { data: client } }: Props) {
    return (
        <>
            <Head title={client.name} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <FlashMessage />

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={clientsIndex()} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{client.name}</h1>
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
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Client since {new Date(client.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <EditClientDialog client={client} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column: details */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* Contact info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Contact information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {client.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                                            {client.email}
                                        </a>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <a href={`tel:${client.phone}`} className="hover:underline">
                                            {client.phone}
                                        </a>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span>{client.address}</span>
                                    </div>
                                )}
                                {client.document_type && client.document_number && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span>
                                            {client.document_type.toUpperCase()}: {client.document_number}
                                        </span>
                                    </div>
                                )}
                                {!client.email && !client.phone && !client.address && !client.document_type && (
                                    <p className="text-sm text-muted-foreground">No contact information provided.</p>
                                )}
                                {client.notes && (
                                    <>
                                        <Separator />
                                        <p className="text-sm text-muted-foreground">{client.notes}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Leads list */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-3">
                                <CardTitle className="text-base">Leads ({client.leads_count ?? client.leads?.length ?? 0})</CardTitle>
                                <Link href={leadsIndex()} className="text-xs text-primary hover:underline">
                                    View all leads
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                {client.leads && client.leads.length > 0 ? (
                                    <div className="divide-y">
                                        {client.leads.map((lead) => {
                                            const statusCfg = LEAD_STATUS[lead.status] ?? { label: lead.status, variant: 'secondary' as const };
                                            return (
                                                <div key={lead.id} className="flex items-center justify-between px-6 py-3">
                                                    <div>
                                                        <p className="text-sm font-medium">{lead.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {SOURCE_LABELS[lead.source] ?? lead.source} ·{' '}
                                                            {new Date(lead.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="px-6 py-4 text-sm text-muted-foreground">No leads registered for this client.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column: summary + user account */}
                    <div className="space-y-4">
                        {/* Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <TrendingUp className="h-4 w-4" />
                                        Leads
                                    </div>
                                    <span className="font-semibold">{client.leads_count ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        Quotes
                                    </div>
                                    <span className="font-semibold">{client.quotes_count ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ShoppingCart className="h-4 w-4" />
                                        Sales
                                    </div>
                                    <span className="font-semibold">{client.sales_count ?? 0}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* User account */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">User account</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {client.user ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{client.user.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">{client.user.email}</span>
                                        </div>
                                        <Link
                                            href={usersIndex()}
                                            className="mt-2 inline-flex items-center text-xs text-primary hover:underline"
                                        >
                                            Manage users →
                                        </Link>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No user account linked to this client.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

ClientShow.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'CRM', href: '#' },
            { title: 'Clients', href: clientsIndex() },
            { title: 'Detail', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
