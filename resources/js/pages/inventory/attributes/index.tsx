import { Head, router, useForm } from '@inertiajs/react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import ConfirmationModal from '@/components/confirmation-modal';
import { FlashMessage } from '@/components/flash-message';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { PaginatedData } from '@/types';

type AttributeOption = {
    id?: number;
    value: string;
    label: string;
};

type Attribute = {
    id: number;
    code: string;
    name: string;
    entity_level: string;
    entity_levels?: string[];
    data_type: string;
    unit: string | null;
    is_filterable: boolean;
    is_required: boolean;
    sort_order: number;
    is_active: boolean;
    product_attribute_values_count?: number;
    attribute_options?: Array<{ id: number; value: string; label: string | null }>;
};

type FormData = {
    code: string;
    name: string;
    entity_levels: string[];
    data_type: string;
    unit: string;
    is_filterable: boolean;
    is_required: boolean;
    sort_order: string;
    is_active: boolean;
    options: AttributeOption[];
};

type Props = {
    attributes: PaginatedData<Attribute>;
    dataTypes: string[];
    entityLevels: string[];
};

const DEFAULT_OPTION: AttributeOption = { value: '', label: '' };

function prettify(value: string): string {
    return value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function buildDefaultForm(): FormData {
    return {
        code: '',
        name: '',
        entity_levels: ['product'],
        data_type: 'text',
        unit: '',
        is_filterable: false,
        is_required: false,
        sort_order: '0',
        is_active: true,
        options: [{ ...DEFAULT_OPTION }],
    };
}

export default function AttributesIndex({ attributes, dataTypes, entityLevels }: Props) {
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Attribute | null>(null);
    const [pendingDeleteAttribute, setPendingDeleteAttribute] = useState<Attribute | null>(null);

    const storeForm = useForm<FormData>(buildDefaultForm());
    const editForm = useForm<FormData>(buildDefaultForm());

    const dataTypeOptions = useMemo(
        () => dataTypes.map((type) => ({ value: type, label: prettify(type) })),
        [dataTypes],
    );

    const entityLevelOptions = useMemo(
        () => entityLevels.map((level) => ({ value: level, label: prettify(level) })),
        [entityLevels],
    );

    function openCreate() {
        storeForm.setData(buildDefaultForm());
        storeForm.clearErrors();
        setCreating(true);
    }

    function openEdit(attribute: Attribute) {
        editForm.setData({
            code: attribute.code,
            name: attribute.name,
            entity_levels: (attribute.entity_levels && attribute.entity_levels.length > 0)
                ? attribute.entity_levels
                : [attribute.entity_level],
            data_type: attribute.data_type,
            unit: attribute.unit ?? '',
            is_filterable: attribute.is_filterable,
            is_required: attribute.is_required,
            sort_order: String(attribute.sort_order ?? 0),
            is_active: attribute.is_active,
            options:
                (attribute.attribute_options ?? []).map((option) => ({
                    id: option.id,
                    value: option.value,
                    label: option.label ?? '',
                })) || [{ ...DEFAULT_OPTION }],
        });

        if ((attribute.attribute_options ?? []).length === 0) {
            editForm.setData('options', [{ ...DEFAULT_OPTION }]);
        }

        editForm.clearErrors();
        setEditing(attribute);
    }

    function normalizePayload(data: FormData) {
        const normalizedOptions = (data.options ?? [])
            .map((option) => ({
                ...(option.id ? { id: option.id } : {}),
                value: option.value.trim() !== '' ? option.value.trim() : option.label.trim(),
                label: option.label.trim(),
            }))
            .filter((option) => option.value !== '');

        return {
            ...data,
            code: data.code.trim(),
            name: data.name.trim(),
            unit: data.unit.trim(),
            sort_order: data.sort_order === '' ? 0 : Number(data.sort_order),
            options: normalizedOptions,
        };
    }

    function submitCreate(e: React.FormEvent) {
        e.preventDefault();

        storeForm.transform((data) => normalizePayload(data));
        storeForm.post('/admin/attributes', {
            onSuccess: () => {
                storeForm.setData(buildDefaultForm());
                setCreating(false);
            },
        });
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();

        if (!editing) {
            return;
        }

        editForm.transform((data) => normalizePayload(data));
        editForm.put(`/admin/attributes/${editing.id}`, {
            onSuccess: () => {
                editForm.setData(buildDefaultForm());
                setEditing(null);
            },
        });
    }

    function deleteAttribute(attribute: Attribute) {
        router.delete(`/admin/attributes/${attribute.id}`);
    }

    function confirmDeleteAttribute() {
        if (!pendingDeleteAttribute) {
            return;
        }

        deleteAttribute(pendingDeleteAttribute);
        setPendingDeleteAttribute(null);
    }

    function addOption(form: typeof storeForm | typeof editForm) {
        form.setData('options', [...form.data.options, { ...DEFAULT_OPTION }]);
    }

    function removeOption(form: typeof storeForm | typeof editForm, index: number) {
        if (form.data.options.length === 1) {
            form.setData('options', [{ ...DEFAULT_OPTION }]);

            return;
        }

        form.setData(
            'options',
            form.data.options.filter((_, optionIndex) => optionIndex !== index),
        );
    }

    function updateOption(
        form: typeof storeForm | typeof editForm,
        index: number,
        field: keyof AttributeOption,
        value: string,
    ) {
        const nextOptions = [...form.data.options];
        const currentOption = nextOptions[index];

        nextOptions[index] = {
            ...currentOption,
            [field]: value,
        };

        form.setData('options', nextOptions);
    }

    function renderOptionsEditor(form: typeof storeForm | typeof editForm) {
        return (
            <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                    <Label>Attribute options *</Label>
                    <Button type="button" size="sm" variant="outline" onClick={() => addOption(form)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add value
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">Products will only allow these predefined values.</p>

                <div className="space-y-2">
                    {form.data.options.map((option, index) => (
                        <div key={option.id ?? `new-option-${index}`} className="grid grid-cols-12 gap-2">
                            <Input
                                value={option.value}
                                onChange={(event) => updateOption(form, index, 'value', event.target.value)}
                                placeholder="value"
                                className="col-span-5"
                            />
                            <Input
                                value={option.label}
                                onChange={(event) => updateOption(form, index, 'label', event.target.value)}
                                placeholder="Label (optional)"
                                className="col-span-6"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="col-span-1 text-destructive hover:text-destructive"
                                onClick={() => removeOption(form, index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <InputError message={form.errors.options} />
                <InputError message={form.errors['options.0.value']} />
            </div>
        );
    }

    return (
        <>
            <Head title="Attributes" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Attributes</h1>
                        <p className="text-sm text-muted-foreground">{attributes.meta.total} attributes registered</p>
                    </div>
                    <Button onClick={openCreate} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New attribute
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Attribute</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">Values</TableHead>
                                    <TableHead className="text-center">Required</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attributes.data.map((attribute) => (
                                    <TableRow key={attribute.id}>
                                        <TableCell>
                                            <div className="font-medium">{attribute.name}</div>
                                            <div className="text-xs text-muted-foreground">{attribute.code}</div>
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            <div className="flex flex-wrap gap-1">
                                                {((attribute.entity_levels && attribute.entity_levels.length > 0)
                                                    ? attribute.entity_levels
                                                    : [attribute.entity_level]).map((level) => (
                                                    <Badge key={`${attribute.id}-${level}`} variant="secondary">
                                                        {prettify(level)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{prettify(attribute.data_type)}</TableCell>
                                        <TableCell className="text-center">{attribute.attribute_options?.length ?? 0}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={attribute.is_required ? 'default' : 'secondary'}>
                                                {attribute.is_required ? 'Yes' : 'No'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={attribute.is_active ? 'default' : 'secondary'}>
                                                {attribute.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(attribute)}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit attribute</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => setPendingDeleteAttribute(attribute)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete attribute</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {attributes.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                            No attributes registered.{' '}
                                            <button className="text-primary underline" onClick={openCreate}>
                                                Create first attribute
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>New attribute</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                    value={storeForm.data.name}
                                    onChange={(event) => storeForm.setData('name', event.target.value)}
                                    placeholder="Material"
                                />
                                <InputError message={storeForm.errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label>Code *</Label>
                                <Input
                                    value={storeForm.data.code}
                                    onChange={(event) => storeForm.setData('code', event.target.value)}
                                    placeholder="material"
                                />
                                <InputError message={storeForm.errors.code} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Entity levels *</Label>
                            <div className="grid grid-cols-1 gap-2 rounded-md border p-3">
                                {entityLevelOptions.map((option) => {
                                    const checked = storeForm.data.entity_levels.includes(option.value);

                                    return (
                                        <div key={`create-level-${option.value}`} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`create-level-${option.value}`}
                                                checked={checked}
                                                onCheckedChange={(nextChecked) => {
                                                    const levels = storeForm.data.entity_levels;

                                                    if (nextChecked === true && !levels.includes(option.value)) {
                                                        storeForm.setData('entity_levels', [...levels, option.value]);

                                                        return;
                                                    }

                                                    if (nextChecked !== true) {
                                                        storeForm.setData('entity_levels', levels.filter((level) => level !== option.value));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`create-level-${option.value}`}>{option.label}</Label>
                                        </div>
                                    );
                                })}
                            </div>
                            <InputError message={storeForm.errors.entity_levels || storeForm.errors['entity_levels.0']} />
                        </div>

                        <div className="space-y-2">
                            <Label>Data type *</Label>
                            <SearchableSelect
                                value={storeForm.data.data_type}
                                onValueChange={(value) => storeForm.setData('data_type', value)}
                                options={dataTypeOptions}
                                placeholder="Select type"
                            />
                            <InputError message={storeForm.errors.data_type} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Unit</Label>
                                <Input
                                    value={storeForm.data.unit}
                                    onChange={(event) => storeForm.setData('unit', event.target.value)}
                                    placeholder="mm, g, cm"
                                />
                                <InputError message={storeForm.errors.unit} />
                            </div>
                            <div className="space-y-2">
                                <Label>Sort order</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={storeForm.data.sort_order}
                                    onChange={(event) => storeForm.setData('sort_order', event.target.value)}
                                />
                                <InputError message={storeForm.errors.sort_order} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 rounded-md border p-3">
                                <Checkbox
                                    id="create-required"
                                    checked={storeForm.data.is_required}
                                    onCheckedChange={(checked) => storeForm.setData('is_required', checked === true)}
                                />
                                <Label htmlFor="create-required">Required in forms</Label>
                            </div>
                            <div className="flex items-center gap-2 rounded-md border p-3">
                                <Checkbox
                                    id="create-filterable"
                                    checked={storeForm.data.is_filterable}
                                    onCheckedChange={(checked) => storeForm.setData('is_filterable', checked === true)}
                                />
                                <Label htmlFor="create-filterable">Available as filter</Label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-md border p-3">
                            <Checkbox
                                id="create-active"
                                checked={storeForm.data.is_active}
                                onCheckedChange={(checked) => storeForm.setData('is_active', checked === true)}
                            />
                            <Label htmlFor="create-active">Attribute active</Label>
                        </div>

                        {renderOptionsEditor(storeForm)}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={storeForm.processing}>
                                {storeForm.processing ? 'Saving...' : 'Create attribute'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit attribute</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                    value={editForm.data.name}
                                    onChange={(event) => editForm.setData('name', event.target.value)}
                                />
                                <InputError message={editForm.errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label>Code *</Label>
                                <Input
                                    value={editForm.data.code}
                                    onChange={(event) => editForm.setData('code', event.target.value)}
                                />
                                <InputError message={editForm.errors.code} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Entity levels *</Label>
                            <div className="grid grid-cols-1 gap-2 rounded-md border p-3">
                                {entityLevelOptions.map((option) => {
                                    const checked = editForm.data.entity_levels.includes(option.value);

                                    return (
                                        <div key={`edit-level-${option.value}`} className="flex items-center gap-2">
                                            <Checkbox
                                                id={`edit-level-${option.value}`}
                                                checked={checked}
                                                onCheckedChange={(nextChecked) => {
                                                    const levels = editForm.data.entity_levels;

                                                    if (nextChecked === true && !levels.includes(option.value)) {
                                                        editForm.setData('entity_levels', [...levels, option.value]);

                                                        return;
                                                    }

                                                    if (nextChecked !== true) {
                                                        editForm.setData('entity_levels', levels.filter((level) => level !== option.value));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`edit-level-${option.value}`}>{option.label}</Label>
                                        </div>
                                    );
                                })}
                            </div>
                            <InputError message={editForm.errors.entity_levels || editForm.errors['entity_levels.0']} />
                        </div>

                        <div className="space-y-2">
                            <Label>Data type *</Label>
                            <SearchableSelect
                                value={editForm.data.data_type}
                                onValueChange={(value) => editForm.setData('data_type', value)}
                                options={dataTypeOptions}
                                placeholder="Select type"
                            />
                            <InputError message={editForm.errors.data_type} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Unit</Label>
                                <Input
                                    value={editForm.data.unit}
                                    onChange={(event) => editForm.setData('unit', event.target.value)}
                                />
                                <InputError message={editForm.errors.unit} />
                            </div>
                            <div className="space-y-2">
                                <Label>Sort order</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={editForm.data.sort_order}
                                    onChange={(event) => editForm.setData('sort_order', event.target.value)}
                                />
                                <InputError message={editForm.errors.sort_order} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 rounded-md border p-3">
                                <Checkbox
                                    id="edit-required"
                                    checked={editForm.data.is_required}
                                    onCheckedChange={(checked) => editForm.setData('is_required', checked === true)}
                                />
                                <Label htmlFor="edit-required">Required in forms</Label>
                            </div>
                            <div className="flex items-center gap-2 rounded-md border p-3">
                                <Checkbox
                                    id="edit-filterable"
                                    checked={editForm.data.is_filterable}
                                    onCheckedChange={(checked) => editForm.setData('is_filterable', checked === true)}
                                />
                                <Label htmlFor="edit-filterable">Available as filter</Label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-md border p-3">
                            <Checkbox
                                id="edit-active"
                                checked={editForm.data.is_active}
                                onCheckedChange={(checked) => editForm.setData('is_active', checked === true)}
                            />
                            <Label htmlFor="edit-active">Attribute active</Label>
                        </div>

                        {renderOptionsEditor(editForm)}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Saving...' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                open={!!pendingDeleteAttribute}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingDeleteAttribute(null);
                    }
                }}
                title="Delete attribute"
                description={pendingDeleteAttribute
                    ? `Are you sure you want to delete "${pendingDeleteAttribute.name}"? This action cannot be undone.`
                    : 'Are you sure you want to delete this attribute?'}
                confirmLabel="Delete"
                confirmVariant="destructive"
                onConfirm={confirmDeleteAttribute}
            />
        </>
    );
}

AttributesIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[{ title: 'Configuration', href: '#' }, { title: 'Attributes', href: '/admin/attributes' }]}>
        {page}
    </AppLayout>
);
