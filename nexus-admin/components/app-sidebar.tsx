"use client"

import * as React from "react";
import { useAuth } from "@/lib/auth-context";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { CommandIcon, DatabaseIcon, LayoutDashboardIcon } from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user, isAuthenticated } = useAuth();

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            className="data-[slot=sidebar-menu-button]:p-1.5!"
                            render={<a href="#" />}
                        >
                            <CommandIcon className="size-5!" />
                            <span className="text-base font-semibold">Acme Inc.</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={[
                    {
                        title: "Dashboard",
                        url: "/",
                        icon: (
                            <LayoutDashboardIcon />
                        ),
                    },
                    {
                        title: "NexusBuddy Config",
                        url: "/nexus-buddy",
                        icon: (
                            <DatabaseIcon />
                        ),
                    },
                ]} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser
                    user={
                        isAuthenticated && user
                            ? {
                                name: user.name,
                                email: user.role
                                    ? user.role.replace("ROLE_", "").replaceAll("_", " ")
                                    : "No Role",
                                avatar: user.avatar || "/avatars/default.jpg"
                            }
                            : {
                                name: "Guest",
                                email: "Not logged in",
                                avatar: "/avatars/default.jpg"
                            }
                    }
                />
            </SidebarFooter>
        </Sidebar>
    )
}
