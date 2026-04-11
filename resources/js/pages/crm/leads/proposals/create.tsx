import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Package, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { show as leadShow } from '@/routes/admin/leads';
import { store as proposalStore } from '@/routes/admin/leads/proposals';
import type { Lead, Product, ProductVariant } from '@/types';

type ProposalItem = {
    product_id: number;
    product_variant_id: number | null;
    product_serial_id: null;
    name: string;
    model: string;
    suggested_price: string;
    description: string;
    notes: string;
    _productName: string;
    _variantSku: string | null;
};

type Props = {
    lead: { data: Lead };
    products: { data: Product[] };
};

function ProductPickerDialog({
    products,
    onSelect,
}: {
    products: Product[];
    onSelect: (product: Product, variant: ProductVariant | null) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Product | null>(null);

    const filtered = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()),
    );

    function pick(product: Product, variant: ProductVariant | null) {
        onSelect(product, variant);
        setOpen(false);
        setSelected(null);
        setSearch('');
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Select product</DialogTitle>
                </DialogHeader>
                <Input
                    placeholder="Search by name or SKU…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
                    autoFocus
                />
                <div className="mt-2 max-h-96 space-y-2 overflow-y-auto pr-1">
                    {filtered.length === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">No active products found.</p>
                    )}
                    {filtered.map((product) => (
                        <div key={product.id}>
                            <button
                                type="button"
                                className="flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
                                onClick={() =>
                                    product.variants && product.variants.length > 1
                                        ? setSelected(product)
                                        : pick(product, product.variants?.[0] ?? null)
                                }
                            >
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Package className="m-auto mt-2.5 h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        SKU: {product.sku}
                                        {product.brand && <> · {product.brand.name}</>}
                                    </p>
                                </div>
                                {product.variants && product.variants.length > 1 && (
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                        {product.variants.length} variants
                                    </Badge>
                                )}
                            </button>

                            {/* Variant picker */}
                            {selected?.id === product.id && (
                                <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-3">
                                    {product.variants?.map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
                                            onClick={() => pick(product, v)}
                                        >
                                            <span className="font-mono text-xs text-muted-foreground">{v.sku}</span>
                                            {v.attribute_summary && <span>— {v.attribute_summary}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function LeadProposalCreate({ lead: { data: lead }, products: { data: products } }: Props) {
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ProposalItem[]>([]);
    const [submitting, setSubmitting] = useState(false);

    function addProduct(product: Product, variant: ProductVariant | null) {
        setItems((prev) => [
            ...prev,
            {
                product_id: product.id,
                product_variant_id: variant?.id ?? null,
                product_serial_id: null,
                name: product.name,
                model: variant?.attribute_summary ?? '',
                suggested_price: variant?.price ?? '',
                description: product.description ?? '',
                notes: '',
                _productName: product.name,
                _variantSku: variant?.sku ?? null,
            },
        ]);
    }

    function updateItem<K extends keyof ProposalItem>(index: number, key: K, value: ProposalItem[K]) {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        const payload = {
            title,
            notes: notes || null,
            items: items.map(({ _productName: _, _variantSku: __, ...item }) => item),
        };

        router.post(proposalStore.url(lead), payload, {
            onError: () => setSubmitting(false),
        });
    }

    const totalSuggested = items.reduce((sum, item) => sum + (parseFloat(item.suggested_price) || 0), 0);

    return (
        <>
            <Head title={`New proposal — ${lead.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center gap-3">
                    <Link href={leadShow.url(lead)} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">New proposal</h1>
                        <p className="text-sm text-muted-foreground">Lead: {lead.title}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
                    {/* Left: product list */}
                    <div className="space-y-4 lg:col-span-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle>Products</CardTitle>
                                <ProductPickerDialog products={products} onSelect={addProduct} />
                            </CardHeader>
                            <CardContent>
                                {items.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted-foreground">
                                        No items added yet. Click "Add product" to select from inventory.
                                    </p>
                                )}
                                <div className="space-y-4">
                                    {items.map((item, index) => (
                                        <div key={index} className="rounded-lg border p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-sm">{item._productName}</p>
                                                    {item._variantSku && (
                                                        <p className="text-xs text-muted-foreground font-mono">{item._variantSku}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Name shown to client</Label>
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Model / Reference</Label>
                                                    <Input
                                                        value={item.model}
                                                        onChange={(e) => updateItem(index, 'model', e.target.value)}
                                                        placeholder="e.g. Submariner 126610LV"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Suggested price *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.suggested_price}
                                                        onChange={(e) => updateItem(index, 'suggested_price', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Description</Label>
                                                    <Input
                                                        value={item.description}
                                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                        placeholder="Brief description"
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs">Notes (internal)</Label>
                                                    <Textarea
                                                        value={item.notes}
                                                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                                                        rows={2}
                                                        placeholder="Condition, provenance, extras…"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: proposal metadata + summary */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Proposal details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Selected watches for you"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="notes">Internal notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Notes not shown to the client"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-4 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Items</span>
                                    <span className="font-medium">{items.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Total suggested</span>
                                    <span className="font-mono font-semibold">
                                        ${totalSuggested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2 pt-2">
                                    <Button type="submit" disabled={submitting || items.length === 0 || !title}>
                                        {submitting ? 'Saving…' : 'Save proposal'}
                                    </Button>
                                    <Link href={leadShow.url(lead)}>
                                        <Button type="button" variant="outline" className="w-full">Cancel</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </>
    );
}

LeadProposalCreate.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'CRM', href: '#' },
            { title: 'Leads', href: '/admin/leads' },
            { title: 'Detail', href: '#' },
            { title: 'New proposal', href: '#' },
        ]}
    >
        {page}
    </AppLayout>
);
