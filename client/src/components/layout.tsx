import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GraduationCap, LayoutDashboard, BookOpen, Users, Building2, BarChart3, Settings, LogOut, User, ChevronDown, FileText, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";

const studentNav = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "My Theses", url: "/student/theses", icon: BookOpen },
  { title: "Feedback", url: "/student/feedback", icon: MessageSquare },
  { title: "Profile", url: "/student/profile", icon: User },
];

const supervisorNav = [
  { title: "Dashboard", url: "/supervisor", icon: LayoutDashboard },
  { title: "Review Theses", url: "/supervisor/theses", icon: FileText },
  { title: "Profile", url: "/supervisor/profile", icon: User },
];

const adminNav = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Manage Users", url: "/admin/users", icon: Users },
  { title: "Departments", url: "/admin/departments", icon: Building2 },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
];

function getRoleColor(role: string) {
  if (role === "admin") return "bg-destructive/10 text-destructive";
  if (role === "supervisor") return "bg-accent text-accent-foreground";
  return "bg-primary/10 text-primary";
}

function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess: () => { queryClient.clear(); window.location.href = "/"; },
  });

  const nav = user?.role === "student" ? studentNav : user?.role === "supervisor" ? supervisorNav : adminNav;

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-sm text-sidebar-foreground leading-none">ThesisNest</div>
            <div className="text-xs text-muted-foreground">THESYS Platform</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
          </div>
          <Button size="icon" variant="ghost" onClick={() => logoutMutation.mutate()} data-testid="button-logout" className="w-7 h-7 flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const style = { "--sidebar-width": "15rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties;
  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center gap-3 px-4 h-12 border-b bg-background flex-shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm text-muted-foreground">ThesisNest</span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
