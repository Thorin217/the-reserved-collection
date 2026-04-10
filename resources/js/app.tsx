import { createInertiaApp } from '@inertiajs/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return <TooltipProvider delayDuration={0}>{app}</TooltipProvider>;
    },
    progress: {
        color: '#4B5563',
    },
});

// Apply appearance preference only in the admin area.
// Portal & auth pages are always dark — the blade anti-FOUC script
// already sets dark on <html> before JS loads, so calling initializeTheme()
// here on portal pages would remove it if the user has appearance='light',
// causing a visible flash.
const _currentPath = window.location.pathname;
const _isAdminArea =
    _currentPath === '/dashboard' ||
    _currentPath.startsWith('/admin') ||
    _currentPath.startsWith('/settings') ||
    _currentPath.startsWith('/appearance');

if (_isAdminArea) {
    initializeTheme();
}
