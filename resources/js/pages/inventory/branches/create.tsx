import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

type FormData = {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country: string;
    is_active: string;
};

export default function BranchesCreate() {
    const { data, setData, transform, post, processing, errors } = useForm<FormData>({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        country: '',
        is_active: '1',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        transform((formData) => ({
            ...formData,
            is_active: formData.is_active === '1',
        }));

        post('/admin/branches');
    }

    return (
        <>
            <Head title="New branch" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">New branch</h1>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Branch information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                                        <InputError message={errors.phone} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                                        <InputError message={errors.email} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input value={data.address} onChange={(e) => setData('address', e.target.value)} />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input value={data.city} onChange={(e) => setData('city', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <Input value={data.state} onChange={(e) => setData('state', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input value={data.country} onChange={(e) => setData('country', e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label>Branch status</Label>
                                    <Select value={data.is_active} onValueChange={(value) => setData('is_active', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Active</SelectItem>
                                            <SelectItem value="0">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={processing}>
                                {processing ? 'Saving...' : 'Create branch'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

BranchesCreate.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Configuration', href: '#' }, { title: 'Branches', href: '/admin/branches' }, { title: 'New', href: '/admin/branches/create' }]}>
        {page}
    </AppLayout>
);
