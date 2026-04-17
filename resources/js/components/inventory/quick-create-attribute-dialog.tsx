import { useEffect, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { SearchableSelectOption } from '@/components/ui/searchable-select';

type AttributeLevel = 'product' | 'variant' | 'serial';

type AttributeDataType = 'text' | 'textarea' | 'number' | 'decimal' | 'boolean' | 'date' | 'select';

export type QuickCreatedAttribute = {
    id: number;
    name: string;
    code: string;
    entity_level: string;
    data_type: AttributeDataType;
    unit: string | null;
    is_required: boolean;
    is_filterable: boolean;
    entity_levels?: string[];
    attribute_options?: Array<{ id: number; value: string; label: string | null }>;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultLevels?: AttributeLevel[];
    onCreated: (attribute: QuickCreatedAttribute) => void;
};

type InlineAttributeResponse = {
    data: QuickCreatedAttribute;
};

const ENTITY_LEVEL_OPTIONS: Array<{ value: AttributeLevel; label: string }> = [
    { value: 'product', label: 'Product' },
    { value: 'variant', label: 'Variant' },
    { value: 'serial', label: 'Serial' },
];

const DATA_TYPE_OPTIONS: SearchableSelectOption[] = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'number', label: 'Number' },
    { value: 'decimal', label: 'Decimal' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select' },
];

function slugifyCode(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

export default function QuickCreateAttributeDialog({ open, onOpenChange, defaultLevels = ['product'], onCreated }: Props) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [entityLevels, setEntityLevels] = useState<AttributeLevel[]>(defaultLevels);
    const [dataType, setDataType] = useState<AttributeDataType>('select');
    const [unit, setUnit] = useState('');
    const [isRequired, setIsRequired] = useState(false);
    const [isFilterable, setIsFilterable] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [optionValue, setOptionValue] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) {
            return;
        }

        setName('');
        setCode('');
        setEntityLevels(defaultLevels);
        setDataType('select');
        setUnit('');
        setIsRequired(false);
        setIsFilterable(false);
        setIsActive(true);
        setOptionValue('');
        setOptions([]);
        setProcessing(false);
        setErrors({});
    }, [defaultLevels, open]);

    const normalizedOptions = useMemo(() => options.map((value) => ({ value, label: value })), [options]);

    function toggleEntityLevel(level: AttributeLevel, enabled: boolean): void {
        if (enabled) {
            if (!entityLevels.includes(level)) {
                setEntityLevels([...entityLevels, level]);
            }

            return;
        }

        const nextLevels = entityLevels.filter((item) => item !== level);
        setEntityLevels(nextLevels);
    }

    function addOption(): void {
        const nextValue = optionValue.trim();

        if (nextValue === '' || options.includes(nextValue)) {
            return;
        }

        setOptions([...options, nextValue]);
        setOptionValue('');
    }

    async function submit(): Promise<void> {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        if (entityLevels.length === 0) {
            setErrors({ entity_levels: 'Select at least one entity level.' });

            return;
        }

        const payload = {
            name: name.trim(),
            code: code.trim() === '' ? slugifyCode(name) : code.trim(),
            entity_levels: entityLevels,
            data_type: dataType,
            unit: unit.trim() === '' ? null : unit.trim(),
            is_required: isRequired,
            is_filterable: isFilterable,
            is_active: isActive,
            options: dataType === 'select' ? normalizedOptions : [{ value: 'default', label: 'Default' }],
        };

        setProcessing(true);
        setErrors({});

        try {
            const response = await window.fetch('/admin/attributes/inline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const payloadErrors = await response.json() as { errors?: Record<string, string[]> };
                const normalized = Object.fromEntries(
                    Object.entries(payloadErrors.errors ?? {}).map(([key, value]) => [key, value[0] ?? 'Invalid value']),
                );
                setErrors(normalized);

                return;
            }

            const responsePayload = await response.json() as InlineAttributeResponse;
            onCreated(responsePayload.data);
            onOpenChange(false);
        } finally {
            setProcessing(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Quick create attribute</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Material" />
                            <InputError message={errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label>Code *</Label>
                            <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="material" />
                            <InputError message={errors.code} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Entity levels *</Label>
                        <div className="grid grid-cols-1 gap-2 rounded-md border p-3">
                            {ENTITY_LEVEL_OPTIONS.map((option) => {
                                const checked = entityLevels.includes(option.value);

                                return (
                                    <div key={`quick-entity-level-${option.value}`} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`quick-entity-level-${option.value}`}
                                            checked={checked}
                                            onCheckedChange={(nextChecked) => toggleEntityLevel(option.value, nextChecked === true)}
                                        />
                                        <Label htmlFor={`quick-entity-level-${option.value}`}>{option.label}</Label>
                                    </div>
                                );
                            })}
                        </div>
                        <InputError message={errors.entity_levels || errors['entity_levels.0']} />
                    </div>

                    <div className="space-y-2">
                        <Label>Data type *</Label>
                        <SearchableSelect
                            value={dataType}
                            onValueChange={(value) => setDataType(value as AttributeDataType)}
                            options={DATA_TYPE_OPTIONS}
                            placeholder="Select type"
                        />
                        <InputError message={errors.data_type} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Unit</Label>
                            <Input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="mm, g, cm" />
                            <InputError message={errors.unit} />
                        </div>
                        <div className="flex items-center gap-2 rounded-md border p-3">
                            <Checkbox id="quick-attribute-active" checked={isActive} onCheckedChange={(checked) => setIsActive(checked === true)} />
                            <Label htmlFor="quick-attribute-active">Attribute active</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 rounded-md border p-3">
                            <Checkbox id="quick-attribute-required" checked={isRequired} onCheckedChange={(checked) => setIsRequired(checked === true)} />
                            <Label htmlFor="quick-attribute-required">Required in forms</Label>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border p-3">
                            <Checkbox id="quick-attribute-filterable" checked={isFilterable} onCheckedChange={(checked) => setIsFilterable(checked === true)} />
                            <Label htmlFor="quick-attribute-filterable">Available as filter</Label>
                        </div>
                    </div>

                    {dataType === 'select' && (
                        <div className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={optionValue}
                                    onChange={(event) => setOptionValue(event.target.value)}
                                    placeholder="Option value"
                                />
                                <Button type="button" variant="outline" onClick={addOption}>Add</Button>
                            </div>
                            {options.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {options.map((value) => (
                                        <span key={value} className="rounded-md border px-2 py-1 text-xs">
                                            {value}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">Add at least one option for select attributes.</p>
                            )}
                            <InputError message={errors.options || errors['options.0.value']} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={submit} disabled={processing}>
                        {processing ? 'Saving...' : 'Create attribute'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
