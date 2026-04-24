import { Head, useForm } from '@inertiajs/react';
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
import { create as auctionsCreate, index as auctionsIndex, store as auctionsStore } from '@/routes/admin/auctions';

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

type Props = {
    variant_units: UnitOption[];
    serial_units: UnitOption[];
};

type AuctionForm = {
    title: string;
    description: string;
    product_variant_id: string;
    product_serial_id: string;
    starting_price: string;
    reserve_price: string;
    minimum_increment: string;
    starts_at: string;
    ends_at: string;
    notes: string;
};

export default function AuctionsCreate({ variant_units, serial_units }: Props) {
    const [sourceType, setSourceType] = useState<'variant' | 'serial'>('variant');
    const [minimumStartAt, setMinimumStartAt] = useState('');
    const { data, setData, post, processing, errors } = useForm<AuctionForm>({
        title: '',
        description: '',
        product_variant_id: '',
        product_serial_id: '',
        starting_price: '',
        reserve_price: '',
        minimum_increment: '100',
        starts_at: '',
        ends_at: '',
        notes: '',
    });

    const selectedVariant = useMemo(
        () => variant_units.find((unit) => unit.id.toString() === data.product_variant_id),
        [variant_units, data.product_variant_id],
    );

    const selectedSerial = useMemo(
        () => serial_units.find((unit) => unit.id.toString() === data.product_serial_id),
        [serial_units, data.product_serial_id],
    );

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

    function hydrateFromUnit(unit: UnitOption, variantId: string, serialId: string = '') {
        setData('product_variant_id', variantId);
        setData('product_serial_id', serialId);

        if (!data.title) {
            setData('title', unit.product_name || unit.label);
        }

        if (!data.starting_price) {
            setData('starting_price', unit.price || '');
        }

        if (!data.reserve_price) {
            setData('reserve_price', unit.price || '');
        }
    }

    return (
        <>
            <Head title="Create auction" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-2xl font-bold">Create auction</h1>

                <form
                    className="grid gap-6 lg:grid-cols-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        post(auctionsStore().url);
                    }}
                >
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Inventory source</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                            setData('product_variant_id', '');
                                            setData('product_serial_id', '');
                                        }}
                                    />
                                </div>

                                {sourceType === 'variant' ? (
                                    <div className="space-y-2">
                                        <Label>Variant unit</Label>
                                        <SearchableSelect
                                            value={data.product_variant_id}
                                            options={variantUnitOptions}
                                            placeholder="Select a variant"
                                            searchPlaceholder="Search variant..."
                                            onValueChange={(value) => {
                                                const unit = variant_units.find((option) => option.id.toString() === value);

                                                if (unit) {
                                                    hydrateFromUnit(unit, value);
                                                }
                                            }}
                                        />
                                        <InputError message={errors.product_variant_id} />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>Serial unit</Label>
                                        <SearchableSelect
                                            value={data.product_serial_id}
                                            options={serialUnitOptions}
                                            placeholder="Select a serial"
                                            searchPlaceholder="Search serial..."
                                            onValueChange={(value) => {
                                                const unit = serial_units.find((option) => option.id.toString() === value);

                                                if (unit) {
                                                    hydrateFromUnit(unit, unit.product_variant_id?.toString() ?? '', value);
                                                }
                                            }}
                                        />
                                        <InputError message={errors.product_serial_id} />
                                    </div>
                                )}
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
                                        <Input value={data.starting_price} onChange={(event) => setData('starting_price', event.target.value)} />
                                        <InputError message={errors.starting_price} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reserve price</Label>
                                        <Input value={data.reserve_price} onChange={(event) => setData('reserve_price', event.target.value)} />
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
                            <CardHeader><CardTitle>Selected unit</CardTitle></CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="bg-muted flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border">
                                    {selectedUnit?.image_url ? (
                                        <img
                                            src={selectedUnit.image_url}
                                            alt={selectedUnit.product_name ?? selectedUnit.label}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-muted-foreground px-4 text-center text-xs">No image available</div>
                                    )}
                                </div>
                                <div className="font-medium">{selectedUnit?.product_name ?? 'No unit selected yet'}</div>
                                <div className="text-muted-foreground">{selectedUnit?.brand_name ?? '—'}</div>
                                <div className="text-muted-foreground">{selectedUnit?.attribute_summary ?? '—'}</div>
                                <div className="text-muted-foreground">
                                    {selectedUnit?.price ? `Reference price: ${formatCurrency(selectedUnit.price)}` : '—'}
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => history.back()}>Cancel</Button>
                            <Button type="submit" className="flex-1" disabled={processing}>{processing ? 'Saving...' : 'Create auction'}</Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

AuctionsCreate.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Commercial', href: '#' }, { title: 'Auctions', href: auctionsIndex().url }, { title: 'Create', href: auctionsCreate().url }]}>
        {page}
    </AppLayout>
);
