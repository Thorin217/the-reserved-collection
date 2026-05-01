import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
import type { LucideIcon } from 'lucide-react';

type NavCollapsibleProps = {
    label?: string;
    title: string;
    icon?: LucideIcon;
    items: NavItem[];
};

export function NavCollapsible({ label, title, icon: Icon, items }: NavCollapsibleProps) {
    const { isCurrentUrl } = useCurrentUrl();
    const isAnyActive = items.some((item) => isCurrentUrl(item.href));
    const [open, setOpen] = useState(isAnyActive);

    return (
        <SidebarGroup className="px-2 py-0">
            {label && (
                <SidebarGroupLabel className="text-[10px] tracking-widest uppercase text-sidebar-foreground/40">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu>
                <SidebarMenuItem>
                    <Collapsible open={open} onOpenChange={setOpen}>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                tooltip={{ children: title }}
                                isActive={isAnyActive}
                                className="data-[active=true]:text-sidebar-primary data-[active=true]:bg-sidebar-primary/15 data-[active=true]:rounded-md"
                            >
                                {Icon && <Icon />}
                                <span>{title}</span>
                                <ChevronRight
                                    className="ml-auto transition-transform duration-200"
                                    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {items.map((item) => (
                                    <SidebarMenuSubItem key={item.title}>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl(item.href)}>
                                            <Link href={item.href}>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </Collapsible>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
}
