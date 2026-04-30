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
    SlidersHorizontal,
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
import { index as auctionEventsIndex } from '@/routes/admin/auction-events';
import { index as auctionsIndex } from '@/routes/admin/auctions';
import { index as payablesIndex } from '@/routes/admin/finance/payables';
import { index as quotesIndex } from '@/routes/admin/finance/quotes';
import { index as receivablesIndex } from '@/routes/admin/finance/receivables';
import { index as salesIndex } from '@/routes/admin/finance/sales';
import { index as leadsIndex } from '@/routes/admin/leads';
import { index as negotiationsIndex } from '@/routes/admin/negotiations';
import { index as productsIndex } from '@/routes/admin/products';
import { index as proposalsIndex } from '@/routes/admin/proposals';
import { index as usersIndex } from '@/routes/admin/users';
import { index as collectorVerificationsIndex } from '@/routes/admin/collector-verifications';
import { index as productNegotiationsIndex } from '@/routes/admin/product-negotiations';
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
    {
        title: 'Warehouses',
        href: '/admin/warehouses',
        icon: Warehouse,
    },
    {
        title: 'Attributes',
        href: '/admin/attributes',
        icon: SlidersHorizontal,
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
    {
        title: 'Portal Negotiations',
        href: productNegotiationsIndex(),
        icon: Handshake,
    },
    {
        title: 'Collector Verifications',
        href: collectorVerificationsIndex(),
        icon: Handshake,
    },
];

const commercialNavItems: NavItem[] = [
    {
        title: 'Auction Events',
        href: auctionEventsIndex(),
        icon: TrendingUp,
    },
    {
        title: 'Auctions',
        href: auctionsIndex(),
        icon: TrendingUp,
    },
    {
        title: 'Quotes',
        href: quotesIndex(),
        icon: FileText,
    },
    {
        title: 'Sales',
        href: salesIndex(),
        icon: TrendingUp,
    },
];

const financeNavItems: NavItem[] = [
    {
        title: 'Receivables',
        href: receivablesIndex(),
        icon: Tag,
    },
    {
        title: 'Payables',
        href: payablesIndex(),
        icon: Building2,
    },
];

const configurationNavItems: NavItem[] = [
    {
        title: 'Users',
        href: usersIndex(),
        icon: Users,
    },
    {
        title: 'Branches',
        href: '/admin/branches',
        icon: Building2,
    },
    {
        title: 'Imports',
        href: '/admin/imports',
        icon: FileText,
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
                <NavCollapsible
                    label="Inventory"
                    title="Inventory"
                    items={inventoryNavItems}
                />
                <SidebarSeparator />
                <NavCollapsible label="CRM" title="CRM" items={crmNavItems} />
                <SidebarSeparator />
                <NavCollapsible
                    label="Commercial"
                    title="Commercial"
                    items={commercialNavItems}
                />
                <SidebarSeparator />
                <NavCollapsible
                    label="Finance"
                    title="Finance"
                    items={financeNavItems}
                />
                <SidebarSeparator />
                <NavCollapsible
                    label="Configuration"
                    title="Configuration"
                    items={configurationNavItems}
                />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
