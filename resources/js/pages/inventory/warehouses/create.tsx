import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

type Branch = {
    id: number;
    name: string;
};

type FormData = {
    branch_id: string;
    name: string;
    type: string;
    allows_sales: string;
    description: string;
    is_active: string;
};

type Props = {
    branches: { data: Branch[] };
    warehouseTypes: string[];
};

export default function WarehousesCreate({ branches, warehouseTypes }: Props) {
    const { data, setData, transform, post, processing, errors } = useForm<FormData>({
        branch_id: '',
        name: '',
        type: 'main',
        allows_sales: '1',
        description: '',
        is_active: '1',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        transform((formData) => ({
            ...formData,
            allows_sales: formData.allows_sales === '1',
            is_active: formData.is_active === '1',
        }));

        post('/admin/warehouses');
    }

    return (
        <>
            <Head title="New warehouse" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">New warehouse</h1>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Warehouse information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Branch *</Label>
                                    <Select value={data.branch_id} onValueChange={(value) => setData('branch_id', value)}>
                                        <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branches.data.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.branch_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Type *</Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {warehouseTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type.replace('_', ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.type} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Allows sales</Label>
                                    <Select value={data.allows_sales} onValueChange={(value) => setData('allows_sales', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Yes</SelectItem>
                                            <SelectItem value="0">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
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
                                {processing ? 'Saving...' : 'Create warehouse'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

WarehousesCreate.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Configuration', href: '#' }, { title: 'Warehouses', href: '/admin/warehouses' }, { title: 'New', href: '/admin/warehouses/create' }]}>
        {page}
    </AppLayout>
);
