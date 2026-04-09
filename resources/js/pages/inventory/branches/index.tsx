import { Head, Link, router } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { PaginatedData } from '@/types';

type Branch = {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    country: string | null;
    is_active: boolean;
    warehouses_count?: number;
};

type Props = {
    branches: PaginatedData<Branch>;
};

export default function BranchesIndex({ branches }: Props) {
    function deleteBranch(branch: Branch) {
        if (!confirm(`Delete branch "${branch.name}"?`)) {
            return;
        }

        router.delete(`/admin/branches/${branch.id}`);
    }

    return (
        <>
            <Head title="Branches" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Branches</h1>
                        <p className="text-sm text-muted-foreground">{branches.meta.total} branches registered</p>
                    </div>
                    <Button asChild size="sm">
                        <Link href="/admin/branches/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New branch
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-center">Warehouses</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branches.data.map((branch) => (
                                    <TableRow key={branch.id}>
                                        <TableCell className="font-medium">{branch.name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {branch.phone ?? branch.email ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {[branch.city, branch.country].filter(Boolean).join(', ') || '—'}
                                        </TableCell>
                                        <TableCell className="text-center">{branch.warehouses_count ?? 0}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                                                {branch.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/admin/branches/${branch.id}/edit`}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit branch</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => deleteBranch(branch)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete branch</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {branches.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                            No branches registered.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BranchesIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Configuration', href: '#' }, { title: 'Branches', href: '/admin/branches' }]}>
        {page}
    </AppLayout>
);
