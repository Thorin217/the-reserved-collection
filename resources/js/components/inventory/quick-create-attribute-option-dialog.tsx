import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type QuickCreatedAttributeOption = {
    id: number;
    attribute_id: number;
    value: string;
    label: string | null;
    sort_order: number;
};

type InlineAttributeOptionResponse = {
    data: QuickCreatedAttributeOption;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attributeId: number | null;
    attributeName?: string;
    onCreated: (option: QuickCreatedAttributeOption) => void;
};

export default function QuickCreateAttributeOptionDialog({
    open,
    onOpenChange,
    attributeId,
    attributeName,
    onCreated,
}: Props) {
    const [value, setValue] = useState('');
    const [label, setLabel] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!open) {
            return;
        }

        setValue('');
        setLabel('');
        setProcessing(false);
        setErrors({});
    }, [open, attributeId]);

    async function submit(): Promise<void> {
        if (!attributeId) {
            setErrors({ value: 'Select an attribute before creating values.' });

            return;
        }

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        setProcessing(true);
        setErrors({});

        try {
            const response = await window.fetch(`/admin/attributes/${attributeId}/options/inline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    value: value.trim(),
                    label: label.trim() === '' ? null : label.trim(),
                }),
            });

            if (!response.ok) {
                const payloadErrors = await response.json() as { errors?: Record<string, string[]> };
                const normalized = Object.fromEntries(
                    Object.entries(payloadErrors.errors ?? {}).map(([key, messages]) => [key, messages[0] ?? 'Invalid value']),
                );
                setErrors(normalized);

                return;
            }

            const responsePayload = await response.json() as InlineAttributeOptionResponse;
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
                    <DialogTitle>
                        New value{attributeName ? ` for ${attributeName}` : ''}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Value *</Label>
                        <Input
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            placeholder="steel"
                        />
                        <InputError message={errors.value} />
                    </div>

                    <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                            value={label}
                            onChange={(event) => setLabel(event.target.value)}
                            placeholder="Steel"
                        />
                        <InputError message={errors.label} />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={submit} disabled={processing}>
                        {processing ? 'Saving...' : 'Create value'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
