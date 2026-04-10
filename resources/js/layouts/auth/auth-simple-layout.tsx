import { Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { home } from '@/routes/portal';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({ children }: AuthLayoutProps) {
    // Auth pages (login/register) are always dark — part of the portal experience
    useEffect(() => {
        const html = document.documentElement;
        const wasDark = html.classList.contains('dark');
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
        return () => {
            if (!wasDark) {
                html.classList.remove('dark');
                const stored = localStorage.getItem('appearance') || 'system';
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = stored === 'dark' || (stored === 'system' && prefersDark);
                html.style.colorScheme = isDark ? 'dark' : 'light';
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href={home()} className="inline-block mb-6">
                        <span className="font-display text-xl font-semibold text-gold tracking-[0.12em]">THE RESERVED</span>
                    </Link>
                </div>
                {children}
            </div>
        </div>
    );
}
