import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, BookOpen, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { Thesis, Feedback } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  submitted:    { label: "Submitted",    color: "text-blue-600",  icon: Clock },
  approved:     { label: "Approved",     color: "text-green-600", icon: CheckCircle },
  rejected:     { label: "Rejected",     color: "text-red-600",   icon: XCircle },
  need_changes: { label: "Need Changes", color: "text-yellow-600",icon: AlertCircle },
};

function ThesisFeedback({ thesis }: { thesis: Thesis }) {
  const { data: feedbacks, isLoading } = useQuery<Feedback[]>({ queryKey: [`/api/theses/${thesis.id}/feedback`] });
  const cfg = statusConfig[thesis.status];
  const Icon = cfg.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{thesis.title}</CardTitle>
            <div className={`flex items-center gap-1 text-xs mt-0.5 ${cfg.color}`}>
              <Icon className="w-3 h-3" />
              <span>{cfg.label}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-12 w-full" />
          </div>
        ) : feedbacks?.length === 0 ? (
          <div className="px-4 pb-4 text-sm text-muted-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            No feedback received yet.
          </div>
        ) : (
          <div className="divide-y">
            {feedbacks?.map((fb) => (
              <div key={fb.id} className="px-4 py-3" data-testid={`feedback-item-${fb.id}`}>
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">{fb.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(fb.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentFeedback() {
  const { data: theses, isLoading } = useQuery<Thesis[]>({ queryKey: ["/api/theses"] });

  const thesesWithFeedback = theses?.filter(t => t.status !== "submitted") || [];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Review feedback from your supervisors</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        ) : theses?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No submissions yet</p>
              <p className="text-muted-foreground text-sm mt-1">Submit a thesis to receive feedback.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {theses?.map(thesis => <ThesisFeedback key={thesis.id} thesis={thesis} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
