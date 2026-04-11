import { Link } from '@inertiajs/react';
import {
    ArrowRightLeft,
    Building2,
    FileText,
    FolderOpen,
    Handshake,
    LayoutGrid,
    Package,
    ShieldCheck,
    Tag,
    TrendingUp,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavCollapsible } from '@/components/nav-collapsible';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as brandsIndex } from '@/routes/admin/brands';
import { index as categoriesIndex } from '@/routes/admin/categories';
import { index as clientsIndex } from '@/routes/admin/clients';
import { index as leadsIndex } from '@/routes/admin/leads';
import { index as negotiationsIndex } from '@/routes/admin/negotiations';
import { index as proposalsIndex } from '@/routes/admin/proposals';
import { index as productsIndex } from '@/routes/admin/products';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const inventoryNavItems: NavItem[] = [
    {
        title: 'Products',
        href: productsIndex(),
        icon: Package,
    },
    {
        title: 'Stocks',
        href: '/admin/inventory/stocks',
        icon: Warehouse,
    },
    {
        title: 'Movements',
        href: '/admin/inventory/movements',
        icon: TrendingUp,
    },
    {
        title: 'Transfers',
        href: '/admin/inventory/transfers',
        icon: ArrowRightLeft,
    },
    {
        title: 'Adjustments',
        href: '/admin/inventory/adjustments',
        icon: ShieldCheck,
    },
    {
        title: 'Reservations',
        href: '/admin/inventory/reservations',
        icon: Tag,
    },
    {
        title: 'Brands',
        href: brandsIndex(),
        icon: Tag,
    },
    {
        title: 'Categories',
        href: categoriesIndex(),
        icon: FolderOpen,
    },
];

const crmNavItems: NavItem[] = [
    {
        title: 'Clients',
        href: clientsIndex(),
        icon: Users,
    },
    {
        title: 'Leads',
        href: leadsIndex(),
        icon: TrendingUp,
    },
    {
        title: 'Proposals',
        href: proposalsIndex(),
        icon: FileText,
    },
    {
        title: 'Negotiations',
        href: negotiationsIndex(),
        icon: Handshake,
    },
];

const configurationNavItems: NavItem[] = [
    {
        title: 'Branches',
        href: '/admin/branches',
        icon: Building2,
    },
    {
        title: 'Warehouses',
        href: '/admin/warehouses',
        icon: Warehouse,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="General" />
                <SidebarSeparator />
                 <NavCollapsible label="Inventory" title="Inventory" items={inventoryNavItems} />
                <SidebarSeparator />
                <NavCollapsible label="Configuration" title="Configuration" items={configurationNavItems} />
                <SidebarSeparator />
                <NavCollapsible label="CRM" title="CRM" items={crmNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
