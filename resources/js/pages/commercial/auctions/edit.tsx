import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    SearchableSelect,
    type SearchableSelectOption,
} from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import AppLayout from '@/layouts/app-layout';
import { edit as auctionEdit, index as auctionsIndex, update as auctionUpdate } from '@/routes/admin/auctions';
import type { Auction } from '@/types';

type UnitOption = {
    id: number;
    product_variant_id?: number;
    label: string;
    price: string | null;
    product_name: string | null;
    brand_name: string | null;
    attribute_summary?: string | null;
    image_url?: string | null;
};

type SelectedLotItem = {
    source_type: 'variant' | 'serial';
    product_variant_id: string;
    product_serial_id: string;
    label: string;
    price: string | null;
    product_name: string | null;
    brand_name: string | null;
    attribute_summary?: string | null;
    image_url?: string | null;
};

type Props = {
    auction: {
        data: Auction;
    };
    variant_units: UnitOption[];
    serial_units: UnitOption[];
};

type AuctionForm = {
    title: string;
    description: string;
    items: Array<{
        product_variant_id: string;
        product_serial_id: string;
        notes: string;
    }>;
    starting_price: string;
    reserve_price: string;
    minimum_increment: string;
    starts_at: string;
    ends_at: string;
    notes: string;
};

function toDateTimeLocal(value: string): string {
    const date = new Date(value);
    const timezoneOffset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default function AuctionsEdit({ auction: { data: auction }, variant_units, serial_units }: Props) {
    const [sourceType, setSourceType] = useState<'variant' | 'serial'>('variant');
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [selectedSerialId, setSelectedSerialId] = useState('');
    const [minimumStartAt, setMinimumStartAt] = useState('');
    const initialLotItems = useMemo<SelectedLotItem[]>(
        () =>
            (auction.items ?? []).map((item) => ({
                source_type: item.product_serial_id ? 'serial' : 'variant',
                product_variant_id: item.product_variant_id.toString(),
                product_serial_id: item.product_serial_id?.toString() ?? '',
                label: item.snapshot?.product_name ?? `Item ${item.position}`,
                price: item.reference_price,
                product_name: item.snapshot?.product_name ?? null,
                brand_name: item.snapshot?.brand_name ?? null,
                attribute_summary: item.snapshot?.attribute_summary ?? null,
                image_url: item.snapshot?.image_url ?? null,
            })),
        [auction.items],
    );
    const [lotItems, setLotItems] = useState<SelectedLotItem[]>(initialLotItems);
    const { data, setData, post, processing, errors, transform } = useForm<AuctionForm>({
        title: auction.title,
        description: auction.description ?? '',
        items: (auction.items ?? []).map((item) => ({
            product_variant_id: item.product_variant_id.toString(),
            product_serial_id: item.product_serial_id?.toString() ?? '',
            notes: item.notes ?? '',
        })),
        starting_price: auction.starting_price,
        reserve_price: auction.reserve_price ?? '',
        minimum_increment: auction.minimum_increment,
        starts_at: toDateTimeLocal(auction.starts_at),
        ends_at: toDateTimeLocal(auction.ends_at),
        notes: auction.notes ?? '',
    });

    const sourceTypeOptions = useMemo<SearchableSelectOption[]>(
        () => [
            { value: 'variant', label: 'Variant / simple', keywords: 'variant simple product' },
            { value: 'serial', label: 'Serial unit', keywords: 'serial serialized product' },
        ],
        [],
    );

    const variantUnitOptions = useMemo<SearchableSelectOption[]>(
        () =>
            variant_units.map((unit) => ({
                value: unit.id.toString(),
                label: unit.label,
                keywords: [unit.product_name, unit.brand_name, unit.attribute_summary].filter(Boolean).join(' '),
            })),
        [variant_units],
    );

    const serialUnitOptions = useMemo<SearchableSelectOption[]>(
        () =>
            serial_units.map((unit) => ({
                value: unit.id.toString(),
                label: unit.label,
                keywords: [unit.product_name, unit.brand_name, unit.attribute_summary].filter(Boolean).join(' '),
            })),
        [serial_units],
    );

    const selectedVariant = useMemo(
        () => variant_units.find((unit) => unit.id.toString() === selectedVariantId),
        [selectedVariantId, variant_units],
    );

    const selectedSerial = useMemo(
        () => serial_units.find((unit) => unit.id.toString() === selectedSerialId),
        [selectedSerialId, serial_units],
    );

    const selectedUnit = selectedSerial ?? selectedVariant;

    useEffect(() => {
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60_000;

        setMinimumStartAt(new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16));
    }, []);

    const minimumEndAt = useMemo(() => {
        if (!data.starts_at) {
            return minimumStartAt;
        }

        const startsAt = new Date(data.starts_at);

        if (Number.isNaN(startsAt.getTime())) {
            return minimumStartAt;
        }

        startsAt.setMinutes(startsAt.getMinutes() + 1);

        const timezoneOffset = startsAt.getTimezoneOffset() * 60_000;

        return new Date(startsAt.getTime() - timezoneOffset).toISOString().slice(0, 16);
    }, [data.starts_at, minimumStartAt]);

    const lotReferenceTotal = useMemo(
        () => lotItems.reduce((total, item) => total + Number(item.price ?? 0), 0),
        [lotItems],
    );

    const selectedUnitPreview = selectedUnit;

    function syncFormItems(nextItems: SelectedLotItem[]) {
        setLotItems(nextItems);
        setData(
            'items',
            nextItems.map((item) => ({
                product_variant_id: item.product_variant_id,
                product_serial_id: item.product_serial_id,
                notes: '',
            })),
        );
    }

    function addSelectedUnit() {
        if (!selectedUnit) {
            return;
        }

        const nextItem: SelectedLotItem = {
            source_type: sourceType,
            product_variant_id: sourceType === 'variant' ? selectedUnit.id.toString() : (selectedUnit.product_variant_id?.toString() ?? ''),
            product_serial_id: sourceType === 'serial' ? selectedUnit.id.toString() : '',
            label: selectedUnit.label,
            price: selectedUnit.price,
            product_name: selectedUnit.product_name,
            brand_name: selectedUnit.brand_name,
            attribute_summary: selectedUnit.attribute_summary,
            image_url: selectedUnit.image_url,
        };

        const itemKey = `${nextItem.product_variant_id}-${nextItem.product_serial_id}`;
        const exists = lotItems.some((item) => `${item.product_variant_id}-${item.product_serial_id}` === itemKey);

        if (exists) {
            return;
        }

        syncFormItems([...lotItems, nextItem]);
        setSelectedVariantId('');
        setSelectedSerialId('');
    }

    function removeLotItem(index: number) {
        syncFormItems(lotItems.filter((_, itemIndex) => itemIndex !== index));
    }

    const itemErrorMessages = Object.entries(errors)
        .filter(([key]) => key.startsWith('items'))
        .map(([, value]) => value);

    return (
        <>
            <Head title={`Edit ${auction.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Edit auction lot</h1>

                <form
                    className="grid gap-6 lg:grid-cols-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        transform((formData) => ({ ...formData, _method: 'put' })).post(auctionUpdate({ auction }).url);
                    }}
                >
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lot items</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_auto]">
                                    <div className="space-y-2">
                                        <Label>Source type</Label>
                                        <SearchableSelect
                                            value={sourceType}
                                            options={sourceTypeOptions}
                                            placeholder="Select source type"
                                            searchPlaceholder="Search source type..."
                                            onValueChange={(value) => {
                                                const nextSourceType = value as 'variant' | 'serial';

                                                if (nextSourceType === sourceType) {
                                                    return;
                                                }

                                                setSourceType(nextSourceType);
                                                setSelectedVariantId('');
                                                setSelectedSerialId('');
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{sourceType === 'variant' ? 'Variant unit' : 'Serial unit'}</Label>
                                        {sourceType === 'variant' ? (
                                            <SearchableSelect
                                                value={selectedVariantId}
                                                options={variantUnitOptions}
                                                placeholder="Select a variant"
                                                searchPlaceholder="Search variant..."
                                                onValueChange={setSelectedVariantId}
                                            />
                                        ) : (
                                            <SearchableSelect
                                                value={selectedSerialId}
                                                options={serialUnitOptions}
                                                placeholder="Select a serial"
                                                searchPlaceholder="Search serial..."
                                                onValueChange={setSelectedSerialId}
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            className="w-full"
                                            onClick={addSelectedUnit}
                                            disabled={selectedUnit === undefined}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add item
                                        </Button>
                                    </div>
                                </div>

                                {itemErrorMessages.length > 0 && (
                                    <div className="space-y-1">
                                        {itemErrorMessages.map((message, index) => (
                                            <InputError key={`${message}-${index}`} message={message} />
                                        ))}
                                    </div>
                                )}

                                <div className="grid gap-3 md:grid-cols-2">
                                    {lotItems.length > 0 ? (
                                        lotItems.map((item, index) => (
                                            <div key={`${item.product_variant_id}-${item.product_serial_id}`} className="flex gap-3 rounded-lg border p-3">
                                                <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-md border">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.product_name ?? item.label}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="text-muted-foreground flex h-full items-center justify-center text-xs">No image</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="font-medium">{item.product_name ?? item.label}</div>
                                                            <div className="text-muted-foreground text-xs capitalize">{item.source_type}</div>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLotItem(index)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-muted-foreground mt-1 text-sm">{item.brand_name ?? '—'}</div>
                                                    <div className="text-muted-foreground text-sm">{item.attribute_summary ?? '—'}</div>
                                                    <div className="text-muted-foreground mt-1 text-sm">
                                                        {item.price ? `Reference price: ${formatCurrency(item.price)}` : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground col-span-full rounded-lg border border-dashed p-6 text-sm">
                                            Add at least one product to build the auction lot.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Auction details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={data.title} onChange={(event) => setData('title', event.target.value)} />
                                    <InputError message={errors.title} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea value={data.description} onChange={(event) => setData('description', event.target.value)} />
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Starting price</Label>
                                        <Input
                                            value={data.starting_price}
                                            onChange={(event) => setData('starting_price', event.target.value)}
                                        />
                                        <InputError message={errors.starting_price} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reserve price</Label>
                                        <Input
                                            value={data.reserve_price}
                                            onChange={(event) => setData('reserve_price', event.target.value)}
                                        />
                                        <InputError message={errors.reserve_price} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Minimum increment</Label>
                                        <Input value={data.minimum_increment} onChange={(event) => setData('minimum_increment', event.target.value)} />
                                        <InputError message={errors.minimum_increment} />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Starts at</Label>
                                        <Input
                                            type="datetime-local"
                                            min={minimumStartAt}
                                            value={data.starts_at}
                                            onChange={(event) => {
                                                const nextStartsAt = event.target.value;

                                                setData('starts_at', nextStartsAt);

                                                if (data.ends_at && nextStartsAt && data.ends_at <= nextStartsAt) {
                                                    setData('ends_at', '');
                                                }
                                            }}
                                        />
                                        <InputError message={errors.starts_at} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ends at</Label>
                                        <Input
                                            type="datetime-local"
                                            min={minimumEndAt}
                                            value={data.ends_at}
                                            onChange={(event) => setData('ends_at', event.target.value)}
                                        />
                                        <InputError message={errors.ends_at} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Internal notes</Label>
                                    <Textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>Selected unit preview</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="bg-muted flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border">
                                    {selectedUnitPreview?.image_url ? (
                                        <img
                                            src={selectedUnitPreview.image_url}
                                            alt={selectedUnitPreview.product_name ?? selectedUnitPreview.label}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-muted-foreground px-4 text-center text-xs">Choose a product to preview it here</div>
                                    )}
                                </div>
                                <div className="font-medium">{selectedUnitPreview?.product_name ?? 'No item selected yet'}</div>
                                <div className="text-muted-foreground">{selectedUnitPreview?.brand_name ?? '—'}</div>
                                <div className="text-muted-foreground">{selectedUnitPreview?.attribute_summary ?? '—'}</div>
                                <div className="text-muted-foreground">
                                    {selectedUnitPreview?.price ? `Reference price: ${formatCurrency(selectedUnitPreview.price)}` : '—'}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Lot summary</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Items</span>
                                    <span className="font-medium">{lotItems.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Auction type</span>
                                    <span className="font-medium">Lot</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Reference total</span>
                                    <span className="font-medium">{formatCurrency(lotReferenceTotal)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => history.back()}>Cancel</Button>
                            <Button type="submit" className="flex-1" disabled={processing}>{processing ? 'Saving...' : 'Update auction'}</Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

AuctionsEdit.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Commercial', href: '#' }, { title: 'Auctions', href: auctionsIndex().url }, { title: 'Edit', href: '#' }]}>
        {page}
    </AppLayout>
);
