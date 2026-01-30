"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileWord,
  IconFolder,
  IconInnerShadowTop,
  IconUsers,
  IconCirclePlusFilled,
  IconMail,
  IconDots,
  IconShare3,
  IconTrash,
  IconClock,
  IconMoneybag,
  IconUserPlus,
  IconClipboard,
  IconShoppingCart,
  IconPackage,
  IconTruck,
  IconLink,
  IconMessageCircle,
  IconEye,
  IconChecklist,
  type Icon
} from "@tabler/icons-react";

import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import Link from "next/link";
import { rolesData } from "@/app/hr/roles/data";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg"
  },
  sidebarSections: [
    {
      id: "main",
      label: null,
      showHeader: true,
      showActions: false,
      items: [
        {
          title: "HR Dashboard",
          url: "/hr",
          icon: IconDashboard
        },
        {
          title: "Analytics",
          url: "#",
          icon: IconChartBar
        },
        {
          title: "Employees",
          url: "/hr/employees",
          icon: IconUsers
        },
        {
          title: "Add Employee",
          url: "/hr/employees/add",
          icon: IconUserPlus
        },
        {
          title: "Payroll",
          url: "/hr/payroll",
          icon: IconMoneybag
        },
        {
          title: "Attendance",
          url: "/hr/attendance",
          icon: IconClock
        },
        {
          title: "Roles & Permissions",
          url: "/hr/roles",
          icon: IconClipboard
        },
        {
          title: "Work Monitoring",
          url: "/hr/work-monitoring",
          icon: IconChecklist
        }
      ]
    }
  ]
};

// Generic sidebar navigation section component
interface SidebarNavItem {
  title: string;
  url: string;
  icon?: Icon;
}

interface SidebarSection {
  id: string;
  label: string | null;
  showHeader: boolean;
  showActions: boolean;
  items: SidebarNavItem[];
}

interface SidebarNavSectionProps {
  section: SidebarSection;
}

function SidebarNavSection({ section }: SidebarNavSectionProps) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const { items, label, showHeader, showActions } = section;

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
  };

  return (
    <SidebarGroup
      className={!showActions ? "" : "group-data-[collapsible=icon]:hidden"}
    >
      {showHeader && (
        <SidebarGroupContent className="flex flex-col gap-2 mb-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <IconCirclePlusFilled />
                <span>Quick Create</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
              >
                <IconMail />
                <span className="sr-only">Inbox</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      )}
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {showActions ? (
              <>
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <a href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      showOnHover
                      className="data-[state=open]:bg-accent rounded-sm"
                    >
                      <IconDots />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-24 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem>
                      <IconFolder />
                      <span>Open</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <IconShare3 />
                      <span>Share</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <IconTrash />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href={item.url}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive(item.url)}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            )}
          </SidebarMenuItem>
        ))}
        {showActions && (
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <IconDots className="text-sidebar-foreground/70" />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAuthenticated } = useAuth();

  // Filter sidebar sections based on user role
  const filteredSections = isAuthenticated
    ? data.sidebarSections.filter((section) => {
        if (!user) return false;

        // All roles have access to all sections
        const roleAccess: Record<string, string[]> = {
          ROLE_ADMIN: ["main", "Products", "materials", "partnerships", "hr"],
          ROLE_DIRECTOR: [
            "main",
            "Products",
            "materials",
            "partnerships",
            "hr"
          ],
          ROLE_PRODUCT_MANAGER: [
            "main",
            "Products",
            "materials",
            "partnerships",
            "hr"
          ],
          ROLE_ACCOUNT_MANAGER: [
            "main",
            "Products",
            "materials",
            "partnerships",
            "hr"
          ],
          ROLE_OPERATION_MANAGER: [
            "main",
            "Products",
            "materials",
            "partnerships",
            "hr"
          ],
          ROLE_WAREHOUSE_MANAGER: [
            "main",
            "Products",
            "materials",
            "partnerships",
            "hr"
          ],
          ROLE_FLEET_MANAGER: [
            "main",
            "Products",
            "materials",
            "partnerships",
            "hr"
          ],
          CLERK: ["main", "Products", "materials", "partnerships", "hr"],
          DRIVER: ["main", "Products", "materials", "partnerships", "hr"]
        };

        return roleAccess[user.role]?.includes(section.id) ?? false;
      })
    : []; // Empty array if not authenticated

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Nexus Inc.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <SidebarNavSection key={section.id} section={section} />
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {!isAuthenticated
              ? "Please log in to view menu items"
              : "No menu items available"}
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            user
              ? {
                  name: user.name,
                  email: user.role
                    ? user.role.replace("ROLE_", "").replaceAll("_", " ")
                    : "No Role",
                  avatar: user.avatar || "/avatars/default.jpg"
                }
              : data.user
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
