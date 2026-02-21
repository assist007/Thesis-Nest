import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Thesis } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  submitted:    { label: "Submitted",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",     icon: Clock },
  approved:     { label: "Approved",     color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  rejected:     { label: "Rejected",     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",         icon: XCircle },
  need_changes: { label: "Need Changes", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
};

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const { data: theses, isLoading } = useQuery<Thesis[]>({ queryKey: ["/api/theses"] });

  const stats = {
    total: theses?.length ?? 0,
    pending: theses?.filter(t => t.status === "submitted").length ?? 0,
    approved: theses?.filter(t => t.status === "approved").length ?? 0,
    reviewed: theses?.filter(t => t.status !== "submitted").length ?? 0,
  };

  const pendingTheses = theses?.filter(t => t.status === "submitted").slice(0, 5);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Supervisor Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Review and manage student thesis submissions</p>
          </div>
          <Link href="/supervisor/theses">
            <Button data-testid="button-review-theses">
              <FileText className="w-4 h-4 mr-2" /> Review Theses
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Theses", value: stats.total, icon: FileText, color: "text-primary" },
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-blue-600 dark:text-blue-400" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
            { label: "Reviewed", value: stats.reviewed, icon: CheckCircle, color: "text-muted-foreground" },
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-base">Pending Reviews</CardTitle>
              <CardDescription className="text-xs">Theses awaiting your review</CardDescription>
            </div>
            <Link href="/supervisor/theses">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : pendingTheses?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                <p className="font-medium text-foreground text-sm">All caught up!</p>
                <p className="text-muted-foreground text-xs mt-1">No pending reviews at the moment.</p>
              </div>
            ) : (
              <div className="divide-y">
                {pendingTheses?.map((thesis) => (
                  <Link key={thesis.id} href={`/supervisor/theses/${thesis.id}`}>
                    <div className="flex items-center gap-4 px-4 py-3 hover-elevate cursor-pointer" data-testid={`pending-thesis-${thesis.id}`}>
                      <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm truncate">{thesis.title}</div>
                        <div className="text-xs text-muted-foreground">Submitted {new Date(thesis.createdAt).toLocaleDateString()}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
