import { Head, Link, useForm } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index as vendorsIndex, store as storeVendor } from '@/routes/admin/finance/vendors';

export default function FinanceVendorsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        tax_id: '',
        contact_person: '',
        address: '',
        notes: '',
        is_active: true,
    });

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(storeVendor());
    }

    return (
        <>
            <Head title="New Vendor" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">New vendor</h1>
                        <p className="text-sm text-muted-foreground">
                            Register a new supplier in the system.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={vendorsIndex()}>Back to vendors</Link>
                    </Button>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Vendor information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-1.5 md:col-span-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Company or supplier name"
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="contact@supplier.com"
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="+1 555 000 0000"
                                />
                                {errors.phone && (
                                    <p className="text-xs text-destructive">{errors.phone}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="tax_id">Tax ID</Label>
                                <Input
                                    id="tax_id"
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    placeholder="RUC, RFC, NIT, etc."
                                />
                                {errors.tax_id && (
                                    <p className="text-xs text-destructive">{errors.tax_id}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="contact_person">Contact person</Label>
                                <Input
                                    id="contact_person"
                                    value={data.contact_person}
                                    onChange={(e) => setData('contact_person', e.target.value)}
                                    placeholder="Primary contact name"
                                />
                                {errors.contact_person && (
                                    <p className="text-xs text-destructive">{errors.contact_person}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5 md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Street, city, country..."
                                    rows={2}
                                />
                                {errors.address && (
                                    <p className="text-xs text-destructive">{errors.address}</p>
                                )}
                            </div>

                            <div className="grid gap-1.5 md:col-span-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Internal notes about this vendor..."
                                    rows={2}
                                />
                                {errors.notes && (
                                    <p className="text-xs text-destructive">{errors.notes}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 md:col-span-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                                />
                                <Label htmlFor="is_active">Active vendor</Label>
                            </div>

                            <div className="flex gap-2 md:col-span-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Create vendor'}
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={vendorsIndex()}>Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

FinanceVendorsCreate.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Finance', href: '#' },
            { title: 'Vendors', href: vendorsIndex() },
            { title: 'New vendor', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
