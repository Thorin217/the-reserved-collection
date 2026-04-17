import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            flash: { success?: string; error?: string; import_run_id?: number | null };
            [key: string]: unknown;
        };
    }
}
