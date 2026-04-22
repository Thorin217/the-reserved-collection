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
import { index as payablesIndex, store as storePayable } from '@/routes/admin/finance/payables';

type VendorOption = { id: number; name: string };

type Props = {
    vendors: { data: VendorOption[] };
};

const NO_VENDOR = '_none';

export default function FinancePayablesCreate({ vendors }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        vendor_id: '',
        vendor_name: '',
        reference: '',
        amount: '',
        due_date: '',
        notes: '',
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(storePayable());
    }

    const showVendorNameField = !data.vendor_id || data.vendor_id === NO_VENDOR;

    return (
        <>
            <Head title="Register Payable" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Register payable</h1>
                        <p className="text-sm text-muted-foreground">
                            Record a new vendor obligation.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={payablesIndex()}>Back to payables</Link>
                    </Button>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Payable details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-1.5 md:col-span-2">
                                <Label htmlFor="vendor_id">Vendor</Label>
                                <Select
                                    value={data.vendor_id || NO_VENDOR}
                                    onValueChange={(value) =>
                                        setData('vendor_id', value === NO_VENDOR ? '' : value)
                                    }
                                >
                                    <SelectTrigger id="vendor_id">
                                        <SelectValue placeholder="Select a registered vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_VENDOR}>— Type vendor name manually —</SelectItem>
                                        {vendors.data.map((vendor) => (
                                            <SelectItem key={vendor.id} value={String(vendor.id)}>
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.vendor_id && (
                                    <p className="text-xs text-destructive">{errors.vendor_id}</p>
                                )}
                            </div>

                            {showVendorNameField && (
                                <div className="grid gap-1.5 md:col-span-2">
                                    <Label htmlFor="vendor_name">Vendor name *</Label>
                                    <Input
                                        id="vendor_name"
                                        value={data.vendor_name}
                                        onChange={(e) => setData('vendor_name', e.target.value)}
                                        placeholder="Enter vendor name"
                                    />
                                    {errors.vendor_name && (
                                        <p className="text-xs text-destructive">{errors.vendor_name}</p>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-1.5">
                                <Label htmlFor="reference">Reference</Label>
                                <Input
                                    id="reference"
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                    placeholder="Invoice #, PO number, etc."
                                />
                                {errors.reference && (
                                    <p className="text-xs text-destructive">{errors.reference}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="amount">Amount *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
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
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Internal notes about this payable..."
                                    rows={2}
                                />
                                {errors.notes && (
                                    <p className="text-xs text-destructive">{errors.notes}</p>
                                )}
                            </div>

                            <div className="flex gap-2 md:col-span-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Register payable'}
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={payablesIndex()}>Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

FinancePayablesCreate.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Payables', href: payablesIndex() },
            { title: 'Register', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
