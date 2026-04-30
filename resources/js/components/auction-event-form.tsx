import { useForm } from '@inertiajs/react';
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
import type { Auction, AuctionEvent } from '@/types';

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
    notes: string;
};

type GroupedAuctionDraft = SelectedLotItem & {
    title: string;
    starting_price: string;
    reserve_price: string;
    minimum_increment: string;
};

type AuctionEventFormData = {
    title: string;
    description: string;
    format: 'lot' | 'grouped_items';
    starts_at: string;
    ends_at: string;
    notes: string;
    items: Array<{
        product_variant_id: string;
        product_serial_id: string;
        notes: string;
    }>;
    starting_price: string;
    reserve_price: string;
    minimum_increment: string;
    grouped_auctions: Array<{
        title: string;
        product_variant_id: string;
        product_serial_id: string;
        notes: string;
        starting_price: string;
        reserve_price: string;
        minimum_increment: string;
    }>;
};

type Props = {
    mode: 'create' | 'edit';
    submitUrl: string;
    variant_units: UnitOption[];
    serial_units: UnitOption[];
    event?: AuctionEvent | null;
    auction?: Auction | null;
};

function toDateTimeLocal(value: string): string {
    const date = new Date(value);
    const timezoneOffset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default function AuctionEventForm({
    mode,
    submitUrl,
    variant_units,
    serial_units,
    event = null,
    auction = null,
}: Props) {
    const initialFormat = (event?.format ?? 'lot') as 'lot' | 'grouped_items';
    const [sourceType, setSourceType] = useState<'variant' | 'serial'>('variant');
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [selectedSerialId, setSelectedSerialId] = useState('');
    const [minimumStartAt, setMinimumStartAt] = useState('');
    const [startingPriceOverridden, setStartingPriceOverridden] = useState(
        mode === 'edit',
    );
    const [reservePriceOverridden, setReservePriceOverridden] = useState(
        mode === 'edit',
    );

    const initialLotItems = useMemo<SelectedLotItem[]>(
        () =>
            (auction?.items ?? []).map((item) => ({
                source_type: item.product_serial_id ? 'serial' : 'variant',
                product_variant_id: item.product_variant_id.toString(),
                product_serial_id: item.product_serial_id?.toString() ?? '',
                label: item.snapshot?.product_name ?? `Item ${item.position}`,
                price: item.reference_price,
                product_name: item.snapshot?.product_name ?? null,
                brand_name: item.snapshot?.brand_name ?? null,
                attribute_summary: item.snapshot?.attribute_summary ?? null,
                image_url: item.snapshot?.image_url ?? null,
                notes: item.notes ?? '',
            })),
        [auction?.items],
    );

    const initialGroupedAuctions = useMemo<GroupedAuctionDraft[]>(
        () =>
            (event?.auctions ?? []).map((childAuction, index) => {
                const item = childAuction.items?.[0];

                return {
                    source_type: item?.product_serial_id ? 'serial' : 'variant',
                    product_variant_id: item?.product_variant_id.toString() ?? '',
                    product_serial_id: item?.product_serial_id?.toString() ?? '',
                    label: item?.snapshot?.product_name ?? `Auction ${index + 1}`,
                    price: item?.reference_price ?? null,
                    product_name: item?.snapshot?.product_name ?? null,
                    brand_name: item?.snapshot?.brand_name ?? null,
                    attribute_summary: item?.snapshot?.attribute_summary ?? null,
                    image_url: item?.snapshot?.image_url ?? null,
                    notes: item?.notes ?? '',
                    title: childAuction.title,
                    starting_price: childAuction.starting_price,
                    reserve_price: childAuction.reserve_price ?? '',
                    minimum_increment: childAuction.minimum_increment,
                };
            }),
        [event?.auctions],
    );

    const [lotItems, setLotItems] = useState<SelectedLotItem[]>(initialLotItems);
    const [groupedAuctions, setGroupedAuctions] = useState<GroupedAuctionDraft[]>(
        initialGroupedAuctions,
    );

    const { data, setData, post, processing, errors, transform } =
        useForm<AuctionEventFormData>({
            title: event?.title ?? auction?.title ?? '',
            description: event?.description ?? auction?.description ?? '',
            format: initialFormat,
            starts_at: event?.starts_at
                ? toDateTimeLocal(event.starts_at)
                : auction?.starts_at
                  ? toDateTimeLocal(auction.starts_at)
                  : '',
            ends_at: event?.ends_at
                ? toDateTimeLocal(event.ends_at)
                : auction?.ends_at
                  ? toDateTimeLocal(auction.ends_at)
                  : '',
            notes: event?.notes ?? auction?.notes ?? '',
            items: initialLotItems.map((item) => ({
                product_variant_id: item.product_variant_id,
                product_serial_id: item.product_serial_id,
                notes: item.notes,
            })),
            starting_price: auction?.starting_price ?? '',
            reserve_price: auction?.reserve_price ?? '',
            minimum_increment: auction?.minimum_increment ?? '100',
            grouped_auctions: initialGroupedAuctions.map((groupedAuction) => ({
                title: groupedAuction.title,
                product_variant_id: groupedAuction.product_variant_id,
                product_serial_id: groupedAuction.product_serial_id,
                notes: groupedAuction.notes,
                starting_price: groupedAuction.starting_price,
                reserve_price: groupedAuction.reserve_price,
                minimum_increment: groupedAuction.minimum_increment,
            })),
        });

    const sourceTypeOptions = useMemo<SearchableSelectOption[]>(
        () => [
            {
                value: 'variant',
                label: 'Variant / simple',
                keywords: 'variant simple product',
            },
            {
                value: 'serial',
                label: 'Serial unit',
                keywords: 'serial serialized product',
            },
        ],
        [],
    );

    const formatOptions = useMemo<SearchableSelectOption[]>(
        () => [
            { value: 'lot', label: 'Lot', keywords: 'single lot full bundle' },
            {
                value: 'grouped_items',
                label: 'Grouped items',
                keywords: 'grouped items child auctions products',
            },
        ],
        [],
    );

    const variantUnitOptions = useMemo<SearchableSelectOption[]>(
        () =>
            variant_units.map((unit) => ({
                value: unit.id.toString(),
                label: unit.label,
                keywords: [unit.product_name, unit.brand_name, unit.attribute_summary]
                    .filter(Boolean)
                    .join(' '),
            })),
        [variant_units],
    );

    const serialUnitOptions = useMemo<SearchableSelectOption[]>(
        () =>
            serial_units.map((unit) => ({
                value: unit.id.toString(),
                label: unit.label,
                keywords: [unit.product_name, unit.brand_name, unit.attribute_summary]
                    .filter(Boolean)
                    .join(' '),
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

        setMinimumStartAt(
            new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16),
        );
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

        return new Date(startsAt.getTime() - timezoneOffset)
            .toISOString()
            .slice(0, 16);
    }, [data.starts_at, minimumStartAt]);

    const lotReferenceTotal = useMemo(
        () => lotItems.reduce((total, item) => total + Number(item.price ?? 0), 0),
        [lotItems],
    );

    const groupedReferenceTotal = useMemo(
        () =>
            groupedAuctions.reduce(
                (total, groupedAuction) => total + Number(groupedAuction.price ?? 0),
                0,
            ),
        [groupedAuctions],
    );

    const lotReferenceTotalValue = useMemo(
        () => (lotItems.length > 0 ? lotReferenceTotal.toFixed(2) : ''),
        [lotItems.length, lotReferenceTotal],
    );

    useEffect(() => {
        if (data.format !== 'lot') {
            return;
        }

        if (!startingPriceOverridden) {
            setData('starting_price', lotReferenceTotalValue);
        }

        if (!reservePriceOverridden) {
            setData('reserve_price', lotReferenceTotalValue);
        }
    }, [
        data.format,
        lotReferenceTotalValue,
        reservePriceOverridden,
        setData,
        startingPriceOverridden,
    ]);

    function syncLotItems(nextItems: SelectedLotItem[]) {
        setLotItems(nextItems);
        setData(
            'items',
            nextItems.map((item) => ({
                product_variant_id: item.product_variant_id,
                product_serial_id: item.product_serial_id,
                notes: item.notes,
            })),
        );
    }

    function syncGroupedAuctions(nextGroupedAuctions: GroupedAuctionDraft[]) {
        setGroupedAuctions(nextGroupedAuctions);
        setData(
            'grouped_auctions',
            nextGroupedAuctions.map((groupedAuction) => ({
                title: groupedAuction.title,
                product_variant_id: groupedAuction.product_variant_id,
                product_serial_id: groupedAuction.product_serial_id,
                notes: groupedAuction.notes,
                starting_price: groupedAuction.starting_price,
                reserve_price: groupedAuction.reserve_price,
                minimum_increment: groupedAuction.minimum_increment,
            })),
        );
    }

    function addSelectedUnit() {
        if (!selectedUnit) {
            return;
        }

        const baseItem: SelectedLotItem = {
            source_type: sourceType,
            product_variant_id:
                sourceType === 'variant'
                    ? selectedUnit.id.toString()
                    : (selectedUnit.product_variant_id?.toString() ?? ''),
            product_serial_id:
                sourceType === 'serial' ? selectedUnit.id.toString() : '',
            label: selectedUnit.label,
            price: selectedUnit.price,
            product_name: selectedUnit.product_name,
            brand_name: selectedUnit.brand_name,
            attribute_summary: selectedUnit.attribute_summary,
            image_url: selectedUnit.image_url,
            notes: '',
        };

        const itemKey = `${baseItem.product_variant_id}-${baseItem.product_serial_id}`;

        if (data.format === 'lot') {
            const exists = lotItems.some(
                (item) =>
                    `${item.product_variant_id}-${item.product_serial_id}` === itemKey,
            );

            if (exists) {
                return;
            }

            const nextItems = [...lotItems, baseItem];

            syncLotItems(nextItems);

            if (!data.title) {
                setData('title', `${selectedUnit.product_name ?? selectedUnit.label} Event`);
            }
        } else {
            const exists = groupedAuctions.some(
                (groupedAuction) =>
                    `${groupedAuction.product_variant_id}-${groupedAuction.product_serial_id}` ===
                    itemKey,
            );

            if (exists) {
                return;
            }

            syncGroupedAuctions([
                ...groupedAuctions,
                {
                    ...baseItem,
                    title: selectedUnit.product_name ?? selectedUnit.label,
                    starting_price: selectedUnit.price ?? '',
                    reserve_price: selectedUnit.price ?? '',
                    minimum_increment: '100',
                },
            ]);

            if (!data.title) {
                setData('title', `${selectedUnit.product_name ?? selectedUnit.label} Event`);
            }
        }

        setSelectedVariantId('');
        setSelectedSerialId('');
    }

    function removeLotItem(index: number) {
        syncLotItems(lotItems.filter((_, itemIndex) => itemIndex !== index));
    }

    function removeGroupedAuction(index: number) {
        syncGroupedAuctions(
            groupedAuctions.filter((_, auctionIndex) => auctionIndex !== index),
        );
    }

    function updateGroupedAuctionField(
        index: number,
        field: keyof GroupedAuctionDraft,
        value: string,
    ) {
        syncGroupedAuctions(
            groupedAuctions.map((groupedAuction, auctionIndex) =>
                auctionIndex === index
                    ? {
                          ...groupedAuction,
                          [field]: value,
                      }
                    : groupedAuction,
            ),
        );
    }

    const lotItemErrorMessages = Object.entries(errors)
        .filter(([key]) => key.startsWith('items'))
        .map(([, value]) => value);

    const groupedAuctionErrorMessages = Object.entries(errors)
        .filter(([key]) => key.startsWith('grouped_auctions'))
        .map(([, value]) => value);

    function groupedAuctionFieldError(
        index: number,
        field:
            | 'title'
            | 'product_variant_id'
            | 'product_serial_id'
            | 'notes'
            | 'starting_price'
            | 'reserve_price'
            | 'minimum_increment',
    ): string | undefined {
        return errors[`grouped_auctions.${index}.${field}` as keyof typeof errors];
    }

    return (
        <form
            className="grid gap-6 lg:grid-cols-3"
            onSubmit={(eventSubmit) => {
                eventSubmit.preventDefault();

                if (mode === 'edit') {
                    transform((formData) => ({ ...formData, _method: 'put' })).post(
                        submitUrl,
                    );

                    return;
                }

                post(submitUrl);
            }}
        >
            <div className="space-y-6 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Event configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Format</Label>
                            <SearchableSelect
                                value={data.format}
                                options={formatOptions}
                                placeholder="Select a format"
                                searchPlaceholder="Search format..."
                                disabled={mode === 'edit'}
                                onValueChange={(value) =>
                                    setData('format', value as 'lot' | 'grouped_items')
                                }
                            />
                            <InputError message={errors.format} />
                        </div>

                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={data.title}
                                onChange={(eventInput) =>
                                    setData('title', eventInput.target.value)
                                }
                            />
                            <InputError message={errors.title} />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={data.description}
                                onChange={(eventInput) =>
                                    setData('description', eventInput.target.value)
                                }
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Starts at</Label>
                                <Input
                                    type="datetime-local"
                                    min={minimumStartAt}
                                    value={data.starts_at}
                                    onChange={(eventInput) => {
                                        const nextStartsAt = eventInput.target.value;

                                        setData('starts_at', nextStartsAt);

                                        if (
                                            data.ends_at &&
                                            nextStartsAt &&
                                            data.ends_at <= nextStartsAt
                                        ) {
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
                                    onChange={(eventInput) =>
                                        setData('ends_at', eventInput.target.value)
                                    }
                                />
                                <InputError message={errors.ends_at} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Internal notes</Label>
                            <Textarea
                                value={data.notes}
                                onChange={(eventInput) =>
                                    setData('notes', eventInput.target.value)
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {data.format === 'lot' ? 'Lot items' : 'Child auctions'}
                        </CardTitle>
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
                                        const nextSourceType = value as
                                            | 'variant'
                                            | 'serial';

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
                                <Label>
                                    {sourceType === 'variant'
                                        ? 'Variant unit'
                                        : 'Serial unit'}
                                </Label>
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
                                    {data.format === 'lot' ? 'Add item' : 'Add auction'}
                                </Button>
                            </div>
                        </div>

                        {data.format === 'lot' && lotItemErrorMessages.length > 0 && (
                            <div className="space-y-1">
                                {lotItemErrorMessages.map((message, index) => (
                                    <InputError key={`${message}-${index}`} message={message} />
                                ))}
                            </div>
                        )}

                        {data.format === 'grouped_items' &&
                            groupedAuctionErrorMessages.length > 0 && (
                                <div className="space-y-1">
                                    {groupedAuctionErrorMessages.map((message, index) => (
                                        <InputError
                                            key={`${message}-${index}`}
                                            message={message}
                                        />
                                    ))}
                                </div>
                            )}

                        {data.format === 'lot' ? (
                            <>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {lotItems.length > 0 ? (
                                        lotItems.map((item, index) => (
                                            <div
                                                key={`${item.product_variant_id}-${item.product_serial_id}`}
                                                className="flex gap-3 rounded-lg border p-3"
                                            >
                                                <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-md border">
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.product_name ?? item.label}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                                                            No image
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="font-medium">
                                                                {item.product_name ?? item.label}
                                                            </div>
                                                            <div className="text-muted-foreground text-xs capitalize">
                                                                {item.source_type}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeLotItem(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-muted-foreground mt-1 text-sm">
                                                        {item.brand_name ?? '—'}
                                                    </div>
                                                    <div className="text-muted-foreground text-sm">
                                                        {item.attribute_summary ?? '—'}
                                                    </div>
                                                    <div className="text-muted-foreground mt-1 text-sm">
                                                        {item.price
                                                            ? `Reference price: ${formatCurrency(item.price)}`
                                                            : '—'}
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

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label>Starting price</Label>
                                        <Input
                                            value={data.starting_price}
                                            onChange={(eventInput) => {
                                                setStartingPriceOverridden(true);
                                                setData(
                                                    'starting_price',
                                                    eventInput.target.value,
                                                );
                                            }}
                                        />
                                        <InputError message={errors.starting_price} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reserve price</Label>
                                        <Input
                                            value={data.reserve_price}
                                            onChange={(eventInput) => {
                                                setReservePriceOverridden(true);
                                                setData(
                                                    'reserve_price',
                                                    eventInput.target.value,
                                                );
                                            }}
                                        />
                                        <InputError message={errors.reserve_price} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Minimum increment</Label>
                                        <Input
                                            value={data.minimum_increment}
                                            onChange={(eventInput) =>
                                                setData(
                                                    'minimum_increment',
                                                    eventInput.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={errors.minimum_increment} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                {groupedAuctions.length > 0 ? (
                                    groupedAuctions.map((groupedAuction, index) => (
                                        <div
                                            key={`${groupedAuction.product_variant_id}-${groupedAuction.product_serial_id}`}
                                            className="rounded-lg border p-4"
                                        >
                                            <div className="flex gap-4">
                                                <div className="bg-muted h-24 w-24 shrink-0 overflow-hidden rounded-md border">
                                                    {groupedAuction.image_url ? (
                                                        <img
                                                            src={groupedAuction.image_url}
                                                            alt={
                                                                groupedAuction.product_name ??
                                                                groupedAuction.label
                                                            }
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                                                            No image
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1 space-y-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="font-medium">
                                                                {groupedAuction.product_name ??
                                                                    groupedAuction.label}
                                                            </div>
                                                            <div className="text-muted-foreground text-xs capitalize">
                                                                {groupedAuction.source_type}
                                                            </div>
                                                            <div className="mt-2 space-y-1">
                                                                <InputError
                                                                    message={groupedAuctionFieldError(
                                                                        index,
                                                                        'product_variant_id',
                                                                    )}
                                                                />
                                                                <InputError
                                                                    message={groupedAuctionFieldError(
                                                                        index,
                                                                        'product_serial_id',
                                                                    )}
                                                                />
                                                            </div>
                                                            <div className="text-muted-foreground mt-1 text-sm">
                                                                {groupedAuction.brand_name ?? '—'}
                                                            </div>
                                                            <div className="text-muted-foreground text-sm">
                                                                {groupedAuction.attribute_summary ??
                                                                    '—'}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                removeGroupedAuction(index)
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label>Child auction title</Label>
                                                            <Input
                                                                value={groupedAuction.title}
                                                                onChange={(eventInput) =>
                                                                    updateGroupedAuctionField(
                                                                        index,
                                                                        'title',
                                                                        eventInput.target.value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError
                                                                message={groupedAuctionFieldError(
                                                                    index,
                                                                    'title',
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Notes</Label>
                                                            <Input
                                                                value={groupedAuction.notes}
                                                                onChange={(eventInput) =>
                                                                    updateGroupedAuctionField(
                                                                        index,
                                                                        'notes',
                                                                        eventInput.target.value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError
                                                                message={groupedAuctionFieldError(
                                                                    index,
                                                                    'notes',
                                                                )}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <Label>Starting price</Label>
                                                            <Input
                                                                value={groupedAuction.starting_price}
                                                                onChange={(eventInput) =>
                                                                    updateGroupedAuctionField(
                                                                        index,
                                                                        'starting_price',
                                                                        eventInput.target.value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError
                                                                message={groupedAuctionFieldError(
                                                                    index,
                                                                    'starting_price',
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Reserve price</Label>
                                                            <Input
                                                                value={groupedAuction.reserve_price}
                                                                onChange={(eventInput) =>
                                                                    updateGroupedAuctionField(
                                                                        index,
                                                                        'reserve_price',
                                                                        eventInput.target.value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError
                                                                message={groupedAuctionFieldError(
                                                                    index,
                                                                    'reserve_price',
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Minimum increment</Label>
                                                            <Input
                                                                value={groupedAuction.minimum_increment}
                                                                onChange={(eventInput) =>
                                                                    updateGroupedAuctionField(
                                                                        index,
                                                                        'minimum_increment',
                                                                        eventInput.target.value,
                                                                    )
                                                                }
                                                            />
                                                            <InputError
                                                                message={groupedAuctionFieldError(
                                                                    index,
                                                                    'minimum_increment',
                                                                )}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="text-muted-foreground text-sm">
                                                        {groupedAuction.price
                                                            ? `Reference price: ${formatCurrency(groupedAuction.price)}`
                                                            : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                                        Add at least one child auction to build the grouped event.
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Selected unit preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="bg-muted flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border">
                            {selectedUnit?.image_url ? (
                                <img
                                    src={selectedUnit.image_url}
                                    alt={selectedUnit.product_name ?? selectedUnit.label}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="text-muted-foreground px-4 text-center text-xs">
                                    Choose a product to preview it here
                                </div>
                            )}
                        </div>
                        <div className="font-medium">
                            {selectedUnit?.product_name ?? 'No item selected yet'}
                        </div>
                        <div className="text-muted-foreground">
                            {selectedUnit?.brand_name ?? '—'}
                        </div>
                        <div className="text-muted-foreground">
                            {selectedUnit?.attribute_summary ?? '—'}
                        </div>
                        <div className="text-muted-foreground">
                            {selectedUnit?.price
                                ? `Reference price: ${formatCurrency(selectedUnit.price)}`
                                : '—'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Event summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Format</span>
                            <span className="font-medium">
                                {data.format === 'lot' ? 'Lot' : 'Grouped items'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                {data.format === 'lot' ? 'Items' : 'Child auctions'}
                            </span>
                            <span className="font-medium">
                                {data.format === 'lot'
                                    ? lotItems.length
                                    : groupedAuctions.length}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Reference total</span>
                            <span className="font-medium">
                                {formatCurrency(
                                    data.format === 'lot'
                                        ? lotReferenceTotal
                                        : groupedReferenceTotal,
                                )}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => history.back()}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={processing}>
                        {processing
                            ? 'Saving...'
                            : mode === 'create'
                              ? 'Create event'
                              : 'Update event'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
