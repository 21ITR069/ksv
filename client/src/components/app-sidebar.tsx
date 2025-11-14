import { Home, Calendar, MessageSquare, BarChart, Settings, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    roles: ["admin", "manager", "hr", "employee", "client"],
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: Calendar,
    roles: ["admin", "manager", "hr", "employee"],
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
    roles: ["admin", "manager", "hr", "employee", "client"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart,
    roles: ["admin", "manager", "hr"],
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    roles: ["admin", "manager"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["admin", "manager", "hr", "employee", "client"],
  },
];

const roleColors = {
  [UserRole.ADMIN]: "bg-primary text-primary-foreground",
  [UserRole.MANAGER]: "bg-chart-2 text-white",
  [UserRole.HR]: "bg-chart-3 text-white",
  [UserRole.EMPLOYEE]: "bg-chart-4 text-white",
  [UserRole.CLIENT]: "bg-muted text-muted-foreground",
};

export function AppSidebar() {
  const { currentUser } = useAuth();
  const [location] = useLocation();

  if (!currentUser) return null;

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">TeamConnect</h2>
            <p className="text-xs text-muted-foreground">Attendance & Chat</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={currentUser.photoURL} />
            <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.displayName}</p>
            <Badge
              className={`mt-1 text-xs ${roleColors[currentUser.role]}`}
              data-testid="user-role-badge"
            >
              {currentUser.role}
            </Badge>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
