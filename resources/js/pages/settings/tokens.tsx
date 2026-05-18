import { router, useForm, usePage } from '@inertiajs/react';
import { Copy, KeyRound, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmationModal from '@/components/confirmation-modal';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { index as tokensIndex, destroy as destroyToken } from '@/routes/tokens';

type Token = {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string;
};

type Props = {
    tokens: { data: Token[] };
};

type FormData = {
    name: string;
};

export default function Tokens({ tokens }: Props) {
    const { flash } = usePage<{ flash?: { plain_text_token?: string; created_token_name?: string } }>().props;
    const [tokenToRevoke, setTokenToRevoke] = useState<Token | null>(null);
    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({ name: '' });

    function handleCreate(event: React.FormEvent) {
        event.preventDefault();
        post(tokensIndex().url, { onSuccess: () => reset() });
    }

    function handleCopy() {
        if (!flash?.plain_text_token) return;
        navigator.clipboard.writeText(flash.plain_text_token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function revokeToken() {
        if (!tokenToRevoke) return;
        router.delete(destroyToken({ token: tokenToRevoke.id }).url, {
            preserveScroll: true,
            onSuccess: () => setTokenToRevoke(null),
        });
    }

    return (
        <>
            <h1 className="sr-only">API Tokens</h1>

            {flash?.plain_text_token && (
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Token created"
                        description="Copy this token now — it will not be shown again"
                    />

                    <Card className="border-amber-400/40 bg-amber-50/70 dark:bg-amber-950/20">
                        <CardContent className="space-y-3 pt-6">
                            <div className="flex items-center gap-2">
                                <code className="flex-1 break-all rounded-md border bg-background px-3 py-2 font-mono text-sm">
                                    {flash.plain_text_token}
                                </code>
                                <Button variant="outline" size="icon" onClick={handleCopy} title="Copy token">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            {copied && <p className="text-xs text-green-600">Copied to clipboard.</p>}
                            <p className="text-xs text-muted-foreground">Token name: {flash.created_token_name}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Create token"
                    description="Generate a new personal access token for API access"
                />

                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="token-name">Token name</Label>
                        <Input
                            id="token-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. my-integration"
                            autoComplete="off"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <Button type="submit" disabled={processing}>
                        Create token
                    </Button>
                </form>
            </div>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Active tokens"
                    description="Your personal access tokens for API authentication"
                />

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Name</TableHead>
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
                                        <TableCell className="text-sm text-muted-foreground">
                                            {token.last_used_at
                                                ? new Date(token.last_used_at).toLocaleString()
                                                : 'Never'}
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
                                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                            No active tokens. Create one above.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <ConfirmationModal
                open={tokenToRevoke !== null}
                onOpenChange={(open) => { if (!open) setTokenToRevoke(null); }}
                title="Revoke token"
                description={`The token "${tokenToRevoke?.name ?? ''}" will be deleted and stop working immediately.`}
                confirmLabel="Revoke"
                cancelLabel="Cancel"
                onConfirm={revokeToken}
                confirmVariant="destructive"
            />
        </>
    );
}

Tokens.layout = {
    breadcrumbs: [
        {
            title: 'API Tokens',
            href: tokensIndex(),
        },
    ],
};
