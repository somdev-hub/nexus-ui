"use client";

import { useAuth } from "@/lib/auth-context";
import {
    IconChartBar,
    IconCirclePlusFilled,
    IconClipboard,
    IconClock,
    IconDashboard,
    IconDots,
    IconFolder,
    IconInnerShadowTop,
    IconMail,
    IconMessageCircle,
    IconMoneybag,
    IconShare3,
    IconTrash,
    IconUsers
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import * as React from "react";

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
import { Building2, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatDialog from "./chat/ChatDialog";

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
          url: "/hr/analytics",
          icon: IconChartBar
        },
        {
          title: "Employees",
          url: "/hr/employees",
          icon: IconUsers
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
          title: "Organization",
          url: "/hr/organization",
          icon: Building2
        },
        {
          title: "HR Requests",
          url: "/hr/requests",
          icon: IconMessageCircle
        },
        {
          title: "Recruitment",
          url: "/hr/recruitment",
          icon: IconClipboard
        },
        {
          title: "Event Onboarding",
          url: "/hr/onboarding",
          icon: PartyPopper
        }
      ]
    }
  ]
};

// Generic sidebar navigation section component
interface SidebarNavItem {
  title: string;
  url: string;
  icon?: React.ElementType;
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
  onOpenChat?: () => void; // Optional callback for opening chat
}

const SidebarNavSection = React.memo(({ section, onOpenChat }: SidebarNavSectionProps) => {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const { items, label, showHeader, showActions } = section;
  const parentRenderCount = useRef(0);

  useEffect(() => {
    parentRenderCount.current++;
    console.log(`🔁 Parent render #${parentRenderCount.current}`);
  }, []);

  const isActive = (url: string) => {
    if (url === "/hr") {
      return pathname === url;
    }
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
              <Link href="/hr/employees/add" className="w-full">
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <IconCirclePlusFilled />
                  <span>Add Employee</span>
                </SidebarMenuButton>
              </Link>
              <Button
                onClick={() => onOpenChat?.()}
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
});

SidebarNavSection.displayName = "SidebarNavSection";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  console.log("🔁 AppSidebar render", new Date().getTime());
  const { user, isAuthenticated } = useAuth();

  const [openChatDialog, setOpenChatDialog] = useState(false);


  // ✅ Stable callback — won't change between renders
  const handleOpenChat = React.useCallback(() => setOpenChatDialog(true), []);

  // No role-based filtering: every authenticated user sees the full menu.
  // Supplier/logistics orgs use their own custom role names, so a hardcoded
  // role map can never match them. The sidebar is presentation-only —
  // backend APIs enforce real permissions.
  const filteredSections = useMemo(() => {
    if (!isAuthenticated || !user) {
      return [];
    }
    return data.sidebarSections;
  }, [isAuthenticated, user]);

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
            <SidebarNavSection key={section.id} section={section} onOpenChat={handleOpenChat} />
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
      <ChatDialog
        showDialog={openChatDialog}
        setOpenChatDialog={setOpenChatDialog}
      />
    </Sidebar>
  );
}
