import { Head, Link, useForm } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import {
    index as receivablesIndex,
    store as storeReceivable,
} from '@/routes/admin/finance/receivables';

type ClientOption = {
    id: number;
    name: string;
    email: string | null;
};

type Props = {
    clients: { data: ClientOption[] };
    default_client_id?: string | null;
};

export default function FinanceReceivablesCreate({ clients: { data: clients }, default_client_id }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        client_id: default_client_id ?? '',
        reference: '',
        amount: '',
        due_date: '',
        notes: '',
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(storeReceivable.url());
    }

    return (
        <>
            <Head title="New Receivable" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">New receivable</h1>
                        <p className="text-sm text-muted-foreground">
                            Register a manual debt or balance owed by a client.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={receivablesIndex()}>Back to receivables</Link>
                    </Button>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Receivable information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-1.5 md:col-span-2">
                                <Label htmlFor="client_id">Client *</Label>
                                <Select
                                    value={data.client_id}
                                    onValueChange={(v) => setData('client_id', v)}
                                >
                                    <SelectTrigger id="client_id">
                                        <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem
                                                key={client.id}
                                                value={String(client.id)}
                                            >
                                                {client.name}
                                                {client.email ? ` — ${client.email}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.client_id && (
                                    <p className="text-xs text-destructive">{errors.client_id}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="amount">Amount *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    placeholder="0.00"
                                />
                                {errors.amount && (
                                    <p className="text-xs text-destructive">{errors.amount}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="due_date">Due date</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                />
                                {errors.due_date && (
                                    <p className="text-xs text-destructive">{errors.due_date}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5 md:col-span-2">
                                <Label htmlFor="reference">Reference</Label>
                                <Input
                                    id="reference"
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                    placeholder="Invoice number, contract, etc."
                                />
                                {errors.reference && (
                                    <p className="text-xs text-destructive">{errors.reference}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5 md:col-span-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Internal notes about this receivable..."
                                    rows={2}
                                />
                                {errors.notes && (
                                    <p className="text-xs text-destructive">{errors.notes}</p>
                                )}
                            </div>

                            <div className="flex gap-2 md:col-span-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Create receivable'}
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={receivablesIndex()}>Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

FinanceReceivablesCreate.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Receivables', href: receivablesIndex() },
            { title: 'New receivable', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
