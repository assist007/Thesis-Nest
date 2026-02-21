import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, Building2, BookOpen, Clock, CheckCircle, XCircle, BarChart3, UserCheck, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Thesis, User, Department } from "@shared/schema";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: users, isLoading: uLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: theses, isLoading: tLoading } = useQuery<Thesis[]>({ queryKey: ["/api/theses"] });
  const { data: departments } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

  const isLoading = uLoading || tLoading;

  const stats = {
    students: users?.filter(u => u.role === "student").length ?? 0,
    supervisors: users?.filter(u => u.role === "supervisor" && u.isApproved).length ?? 0,
    pendingApprovals: users?.filter(u => u.role === "supervisor" && !u.isApproved).length ?? 0,
    departments: departments?.length ?? 0,
    totalTheses: theses?.length ?? 0,
    approved: theses?.filter(t => t.status === "approved").length ?? 0,
    pending: theses?.filter(t => t.status === "submitted").length ?? 0,
    rejected: theses?.filter(t => t.status === "rejected").length ?? 0,
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage the ThesisNest platform</p>
        </div>

        {stats.pendingApprovals > 0 && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <UserCheck className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {stats.pendingApprovals} supervisor{stats.pendingApprovals > 1 ? "s" : ""} pending approval
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">Review and approve supervisor accounts</p>
            </div>
            <Link href="/admin/users">
              <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-700 dark:text-yellow-400" data-testid="button-review-pending">
                Review <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* User & Dept Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Students", value: stats.students, icon: Users, color: "text-primary" },
            { label: "Supervisors", value: stats.supervisors, icon: UserCheck, color: "text-green-600 dark:text-green-400" },
            { label: "Pending Approvals", value: stats.pendingApprovals, icon: Clock, color: "text-yellow-600 dark:text-yellow-400" },
            { label: "Departments", value: stats.departments, icon: Building2, color: "text-purple-600 dark:text-purple-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{isLoading ? <Skeleton className="w-6 h-6" /> : value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Thesis Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Theses", value: stats.totalTheses, icon: BookOpen, color: "text-foreground" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-blue-600 dark:text-blue-400" },
            { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600 dark:text-red-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{isLoading ? <Skeleton className="w-6 h-6" /> : value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Manage Users", desc: "Create, approve, and manage user accounts", icon: Users, url: "/admin/users", color: "bg-primary/10 text-primary" },
            { title: "Departments", desc: "Add and manage academic departments", icon: Building2, url: "/admin/departments", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
            { title: "Reports", desc: "View thesis and review statistics", icon: BarChart3, url: "/admin/reports", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
          ].map(({ title, desc, icon: Icon, url, color }) => (
            <Link key={url} href={url}>
              <Card className="cursor-pointer hover-elevate h-full" data-testid={`quick-action-${title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-3 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-semibold text-foreground text-sm">{title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
