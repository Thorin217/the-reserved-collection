import { Head, router, useForm, usePage } from '@inertiajs/react';
import { KeyRound, Search, Trash2, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import TablePagination from '@/components/table-pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index as accessIndex, store as accessStore, destroy as destroyAccessToken } from '@/routes/admin/access';
import type { PaginatedData, User } from '@/types';

const ALL = '__all__';

type AccessToken = {
    id: number;
    name: string;
    last_used_at: string | null;
    expires_at: string | null;
    created_at: string;
    tokenable?: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type Props = {
    tokens: PaginatedData<AccessToken>;
    users: { data: User[] };
    filters: {
        search?: string;
        user_id?: number | string;
    };
};

type FormData = {
    user_id: string;
};

export default function AccessIndex({ tokens, users, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [tokenToRevoke, setTokenToRevoke] = useState<AccessToken | null>(null);
    const { flash } = usePage<{ flash?: { plain_text_token?: string; created_token_name?: string; created_token_user?: string } }>().props;
    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        user_id: '',
    });

    const userOptions = useMemo<SearchableSelectOption[]>(
        () => users.data.map((user) => ({
            value: user.id.toString(),
            label: `${user.name} / ${user.email}`,
            keywords: `${user.name} ${user.email}`,
        })),
        [users.data],
    );

    const filterUserOptions: SearchableSelectOption[] = [
        { value: ALL, label: 'All users' },
        ...userOptions,
    ];

    function applyFilter(key: string, value: string) {
        const resolved = value === ALL ? undefined : value || undefined;
        router.get(accessIndex(), { ...filters, [key]: resolved }, { preserveState: true, replace: true });
    }

    function handleCreateToken(event: React.FormEvent) {
        event.preventDefault();

        post(accessStore().url, {
            onSuccess: () => {
                reset();
            },
        });
    }

    function revokeToken() {
        if (!tokenToRevoke) {
            return;
        }

        router.delete(destroyAccessToken({ token: tokenToRevoke.id }).url, {
            preserveScroll: true,
            onSuccess: () => setTokenToRevoke(null),
        });
    }

    return (
        <>
            <Head title="Access" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                {flash?.plain_text_token && (
                    <Card className="border-amber-400/40 bg-amber-50/70 dark:bg-amber-950/20">
                        <CardHeader>
                            <CardTitle>New access token</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                This token for <span className="font-medium text-foreground">{flash.created_token_user}</span> will only be shown once.
                            </p>
                            <div className="rounded-md border bg-background px-3 py-3 font-mono text-sm break-all">
                                {flash.plain_text_token}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Token name: {flash.created_token_name}
                            </p>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create access token</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateToken} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>User</Label>
                                    <SearchableSelect
                                        value={data.user_id}
                                        options={userOptions}
                                        placeholder="Select a user"
                                        searchPlaceholder="Search user..."
                                        onValueChange={(value) => setData('user_id', value)}
                                    />
                                    {errors.user_id && <p className="text-xs text-destructive">{errors.user_id}</p>}
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    The token name will be generated automatically using the selected user.
                                </p>

                                <Button type="submit" disabled={processing} className="w-full">
                                    Create token
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">Access</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage API access tokens associated with users.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    applyFilter('search', search);
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    placeholder="Search token or user..."
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    className="w-72"
                                />
                                <Button type="submit" variant="outline" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>

                            <div className="w-72">
                                <SearchableSelect
                                    value={filters.user_id?.toString() ?? ALL}
                                    options={filterUserOptions}
                                    placeholder="Filter by user"
                                    searchPlaceholder="Search user..."
                                    onValueChange={(value) => applyFilter('user_id', value)}
                                />
                            </div>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead>Token</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Last used</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tokens.data.map((token) => (
                                            <TableRow key={token.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <KeyRound className="h-4 w-4 text-muted-foreground" />
                                                        {token.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <UserRound className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="font-medium">{token.tokenable?.name ?? 'Unknown user'}</div>
                                                            <div className="text-xs text-muted-foreground">{token.tokenable?.email ?? '—'}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {token.last_used_at ? new Date(token.last_used_at).toLocaleString() : 'Never'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(token.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Revoke token"
                                                        onClick={() => setTokenToRevoke(token)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {tokens.data.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                                    No access tokens found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {tokens.meta.last_page > 1 && (
                            <TablePagination
                                currentPage={tokens.meta.current_page}
                                lastPage={tokens.meta.last_page}
                                onPageChange={(page) =>
                                    router.get(accessIndex(), { ...filters, page: String(page) }, { preserveState: true, replace: true })
                                }
                            />
                        )}
                    </div>
                </div>

                <ConfirmationModal
                    open={tokenToRevoke !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setTokenToRevoke(null);
                        }
                    }}
                    title="Revoke access token"
                    description={`The token "${tokenToRevoke?.name ?? ''}" will be deleted and will stop working immediately.`}
                    confirmLabel="Revoke token"
                    cancelLabel="Cancel"
                    onConfirm={revokeToken}
                    confirmVariant="destructive"
                />
            </div>
        </>
    );
}

AccessIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Configuration', href: '#' }, { title: 'Access', href: accessIndex() }]}>
        {page}
    </AppLayout>
);
