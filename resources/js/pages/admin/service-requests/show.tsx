import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, CheckCircle, Clock, CreditCard, ExternalLink, SendHorizonal, Wrench, X } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { index as serviceRequestsIndex, markPaid, sendInvoice, update as updateServiceRequest } from '@/routes/admin/service-requests';
import { store as storeMessage } from '@/routes/admin/service-requests/messages';

type Message = {
    id: number;
    message: string;
    is_admin: boolean;
    sender_name: string;
    created_at: string;
};

type ServiceRequest = {
    id: number;
    service_type: string;
    service_type_label: string;
    status: string;
    status_label: string;
    scheduled_at: string;
    notes: string | null;
    internal_notes: string | null;
    completed_at: string | null;
    created_at: string;
    sale_id: number | null;
    sale: { id: number; sale_number: string; total: number; balance_due: number; status: string } | null;
    messages: Message[];
    user: { id: number; name: string; email: string } | null;
    sale_item: {
        id: number;
        sale_id: number;
        description: string | null;
        unit_price: string;
        product_variant: { product: { name: string; brand: { name: string } | null } | null } | null;
        sale: { sale_number: string; sold_at: string | null } | null;
    } | null;
};

type StatusOption = { value: string; label: string };

type Props = {
    service_request: { data: ServiceRequest };
    statuses: StatusOption[];
};

const STATUS_CONFIG: Record<string, { icon: typeof Calendar; color: string }> = {
    scheduled: { icon: Calendar, color: 'text-yellow-500' },
    in_progress: { icon: Clock, color: 'text-blue-500' },
    completed: { icon: CheckCircle, color: 'text-green-500' },
    cancelled: { icon: X, color: 'text-muted-foreground' },
};

export default function ServiceRequestShow({ service_request: { data: sr }, statuses }: Props) {
    const statusForm = useForm({
        status: sr.status,
        internal_notes: sr.internal_notes ?? '',
    });

    const msgForm = useForm({ message: '' });

    function handleStatusSubmit(e: React.FormEvent) {
        e.preventDefault();
        statusForm.put(updateServiceRequest(sr));
    }

    function sendMessage() {
        msgForm.post(storeMessage(sr), {
            onSuccess: () => msgForm.reset(),
        });
    }

    const cfg = STATUS_CONFIG[sr.status] ?? STATUS_CONFIG.scheduled;
    const Icon = cfg.icon;
    const itemName = sr.sale_item?.product_variant?.product?.name ?? sr.sale_item?.description ?? '—';
    const brandName = sr.sale_item?.product_variant?.product?.brand?.name ?? null;

    return (
        <>
            <Head title={`Service Request #${sr.id}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={serviceRequestsIndex()}>
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Service Request #{sr.id}</h1>
                            <p className="text-sm text-muted-foreground">Submitted {new Date(sr.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                        <span className="font-medium">{sr.status_label}</span>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Left: details + thread */}
                    <div className="space-y-4 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Request Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Service Type</p>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                                            <p className="font-medium">{sr.service_type_label}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Preferred Date</p>
                                        <p className="mt-1 font-medium">{sr.scheduled_at}</p>
                                    </div>
                                    {sr.completed_at && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Completed At</p>
                                            <p className="mt-1 font-medium">{new Date(sr.completed_at).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                                {sr.notes && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Client Notes</p>
                                        <p className="mt-1 text-sm">{sr.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Conversation thread */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Conversation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-0">
                                    {sr.messages.length === 0 && (
                                        <p className="py-6 text-center text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
                                    )}

                                    {sr.messages.map((msg) => (
                                        <div key={msg.id} className={`flex gap-3 py-3 ${msg.is_admin ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${msg.is_admin ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                {msg.sender_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className={`max-w-[75%] ${msg.is_admin ? 'items-end' : ''} flex flex-col`}>
                                                <div className={`rounded-lg px-3 py-2 text-sm ${msg.is_admin ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                                    <p className="mb-0.5 text-[10px] font-medium opacity-70">{msg.sender_name}</p>
                                                    <p>{msg.message}</p>
                                                </div>
                                                <p className="mt-1 text-[10px] text-muted-foreground">
                                                    {new Date(msg.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Admin reply */}
                                <div className="mt-3 flex gap-2 border-t pt-4">
                                    <textarea
                                        value={msgForm.data.message}
                                        onChange={(e) => msgForm.setData('message', e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        rows={2}
                                        placeholder="Reply to client... (Enter to send)"
                                        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        onClick={sendMessage}
                                        disabled={msgForm.processing || !msgForm.data.message}
                                    >
                                        <SendHorizonal className="h-4 w-4" />
                                    </Button>
                                </div>
                                {msgForm.errors.message && <p className="mt-1 text-xs text-destructive">{msgForm.errors.message}</p>}
                            </CardContent>
                        </Card>

                        {sr.sale_item && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Item</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-medium">{itemName}</p>
                                    {brandName && <p className="text-sm text-muted-foreground">{brandName}</p>}
                                    {sr.sale_item.sale && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Sale {sr.sale_item.sale.sale_number}
                                            {sr.sale_item.sale.sold_at ? ` · ${new Date(sr.sale_item.sale.sold_at).toLocaleDateString()}` : ''}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Client</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="font-medium">{sr.user?.name ?? '—'}</p>
                                <p className="text-sm text-muted-foreground">{sr.user?.email ?? ''}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: admin actions */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Update Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleStatusSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label>Status</Label>
                                        <Select value={statusForm.data.status} onValueChange={(v) => statusForm.setData('status', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {statuses.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {statusForm.errors.status && <p className="text-xs text-destructive">{statusForm.errors.status}</p>}
                                    </div>

                                    <Button type="submit" disabled={statusForm.processing} className="w-full">
                                        {statusForm.processing ? 'Saving...' : 'Update Status'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {sr.sale && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Service Invoice</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">{sr.sale.sale_number}</p>
                                        <Badge variant={sr.sale.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                                            {sr.sale.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Total</span>
                                        <span className="font-medium">{formatCurrency(sr.sale.total)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Balance Due</span>
                                        <span className={sr.sale.balance_due > 0 ? 'font-medium text-destructive' : 'font-medium text-green-600'}>
                                            {formatCurrency(sr.sale.balance_due)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-1">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/finance/sales/${sr.sale.id}/edit`}>
                                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                                Edit Invoice
                                            </Link>
                                        </Button>
                                        {sr.sale.status === 'draft' && sr.sale.total > 0 && (
                                            <Button size="sm" onClick={() => router.post(sendInvoice(sr).url)}>
                                                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                                Send Invoice
                                            </Button>
                                        )}
                                        {sr.sale.balance_due > 0 && (
                                            <Button size="sm" onClick={() => router.post(markPaid(sr).url)}>
                                                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                                                Mark as Paid
                                            </Button>
                                        )}
                                        {sr.sale.balance_due === 0 && (
                                            <p className="text-center text-xs text-green-600">Invoice paid ✓</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

ServiceRequestShow.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Service Requests', href: serviceRequestsIndex() }, { title: 'Detail', href: '#' }]}>
        {page}
    </AppLayout>
);
