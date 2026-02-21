import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, Plus, FileText } from "lucide-react";
import { Link } from "wouter";
import type { Thesis } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  submitted:     { label: "Submitted",     color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",    icon: Clock },
  approved:      { label: "Approved",      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  rejected:      { label: "Rejected",      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",        icon: XCircle },
  need_changes:  { label: "Need Changes",  color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: theses, isLoading } = useQuery<Thesis[]>({ queryKey: ["/api/theses"] });

  const stats = {
    total: theses?.length ?? 0,
    approved: theses?.filter(t => t.status === "approved").length ?? 0,
    pending: theses?.filter(t => t.status === "submitted").length ?? 0,
    needChanges: theses?.filter(t => t.status === "need_changes").length ?? 0,
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Track your thesis submissions and feedback</p>
          </div>
          <Link href="/student/theses">
            <Button data-testid="button-submit-thesis">
              <Plus className="w-4 h-4 mr-2" />
              Submit Thesis
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Submitted", value: stats.total, icon: BookOpen, color: "text-primary" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
            { label: "Under Review", value: stats.pending, icon: Clock, color: "text-blue-600 dark:text-blue-400" },
            { label: "Need Changes", value: stats.needChanges, icon: AlertCircle, color: "text-yellow-600 dark:text-yellow-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0`}>
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

        {/* Recent Theses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">Recent Submissions</CardTitle>
              <CardDescription className="text-xs">Your latest thesis proposals</CardDescription>
            </div>
            <Link href="/student/theses">
              <Button variant="ghost" size="sm" className="text-xs" data-testid="link-view-all">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : theses?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground text-sm">No submissions yet</p>
                <p className="text-muted-foreground text-xs mt-1">Submit your first thesis proposal to get started</p>
                <Link href="/student/theses">
                  <Button size="sm" className="mt-4" data-testid="button-submit-first">Submit Your First Thesis</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {theses?.slice(0, 5).map((thesis) => {
                  const cfg = statusConfig[thesis.status];
                  const Icon = cfg.icon;
                  return (
                    <Link key={thesis.id} href={`/student/theses/${thesis.id}`}>
                      <div className="flex items-center gap-4 px-4 py-3 hover-elevate cursor-pointer" data-testid={`thesis-item-${thesis.id}`}>
                        <div className="w-9 h-9 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground text-sm truncate">{thesis.title}</div>
                          <div className="text-xs text-muted-foreground">Version {thesis.currentVersion} · {new Date(thesis.updatedAt).toLocaleDateString()}</div>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-sm ${cfg.color} whitespace-nowrap flex-shrink-0`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
