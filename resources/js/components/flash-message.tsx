import { usePage } from '@inertiajs/react';
import { CheckCircle, XCircle } from 'lucide-react';

export function FlashMessage() {
    const { flash } = usePage().props;

    if (!flash?.success && !flash?.error) {
        return null;
    }

    return (
        <div className="mb-4">
            {flash.success && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {flash.error}
                </div>
            )}
        </div>
    );
}
