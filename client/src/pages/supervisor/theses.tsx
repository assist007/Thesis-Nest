import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, MessageSquare, ArrowLeft, Filter, Users } from "lucide-react";
import type { Thesis, Feedback, ThesisVersion, User, Department } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  submitted:    { label: "Submitted",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",     icon: Clock },
  approved:     { label: "Approved",     color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  rejected:     { label: "Rejected",     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",         icon: XCircle },
  need_changes: { label: "Need Changes", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
};

const feedbackSchema = z.object({ comment: z.string().min(5, "Feedback must be at least 5 characters") });

function ThesisReview({ id }: { id: string }) {
  const { toast } = useToast();
  const { data: thesis, isLoading } = useQuery<Thesis>({ queryKey: [`/api/theses/${id}`] });
  const { data: versions } = useQuery<ThesisVersion[]>({ queryKey: [`/api/theses/${id}/versions`] });
  const { data: feedbacks } = useQuery<Feedback[]>({ queryKey: [`/api/theses/${id}/feedback`] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const reviewMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => apiRequest("PATCH", `/api/theses/${id}/review`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/theses"] });
      queryClient.invalidateQueries({ queryKey: [`/api/theses/${id}`] });
      toast({ title: "Review submitted", description: "The thesis status has been updated." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const feedbackForm = useForm({ resolver: zodResolver(feedbackSchema), defaultValues: { comment: "" } });

  const feedbackMutation = useMutation({
    mutationFn: (data: z.infer<typeof feedbackSchema>) => apiRequest("POST", `/api/theses/${id}/feedback`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/theses/${id}/feedback`] });
      toast({ title: "Feedback sent", description: "Your feedback has been saved." });
      feedbackForm.reset();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <AppLayout><div className="max-w-3xl mx-auto space-y-4">{[1,2].map(i=><Skeleton key={i} className="h-40"/>)}</div></AppLayout>;
  if (!thesis) return <AppLayout><div>Not found</div></AppLayout>;

  const cfg = statusConfig[thesis.status];
  const Icon = cfg.icon;
  const student = users?.find(u => u.id === thesis.studentId);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/supervisor/theses">
            <Button variant="ghost" size="sm" data-testid="button-back-theses">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Theses
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">{thesis.title}</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  By {student?.name || "Unknown Student"} · Version {thesis.currentVersion} · {new Date(thesis.updatedAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-sm ${cfg.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Abstract</div>
              <p className="text-sm text-foreground leading-relaxed">{thesis.abstract}</p>
            </div>

            {versions && versions.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Files Submitted</div>
                <div className="space-y-1">
                  {versions.map(v => (
                    <div key={v.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">v{v.version}</span>
                      <span className="text-muted-foreground">— {v.fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {thesis.status === "submitted" && (
              <div className="border-t pt-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Make a Decision</div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => reviewMutation.mutate({ status: "approved" })} className="bg-green-600 text-white" disabled={reviewMutation.isPending} data-testid="button-approve">
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ status: "need_changes" })} disabled={reviewMutation.isPending} data-testid="button-need-changes">
                    <AlertCircle className="w-4 h-4 mr-1.5" /> Need Changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ status: "rejected" })} className="border-destructive text-destructive" disabled={reviewMutation.isPending} data-testid="button-reject">
                    <XCircle className="w-4 h-4 mr-1.5" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Give Feedback */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Give Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...feedbackForm}>
              <form onSubmit={feedbackForm.handleSubmit((d) => feedbackMutation.mutate(d))} className="space-y-3">
                <FormField control={feedbackForm.control} name="comment" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea data-testid="input-feedback" placeholder="Write your feedback for the student..." className="min-h-[100px] resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={feedbackMutation.isPending} data-testid="button-send-feedback">
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    {feedbackMutation.isPending ? "Sending..." : "Send Feedback"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Previous Feedback */}
        {feedbacks && feedbacks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Previous Feedback</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {feedbacks.map(fb => (
                  <div key={fb.id} className="px-4 py-3">
                    <p className="text-sm text-foreground">{fb.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(fb.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export default function SupervisorTheses() {
  const [match, params] = useRoute("/supervisor/theses/:id");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: theses, isLoading } = useQuery<Thesis[]>({ queryKey: ["/api/theses"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  if (match && params?.id) return <ThesisReview id={params.id} />;

  const filtered = statusFilter === "all" ? theses : theses?.filter(t => t.status === statusFilter);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Review Theses</h1>
            <p className="text-muted-foreground text-sm mt-0.5">All student submissions for review</p>
          </div>
          <Select onValueChange={setStatusFilter} defaultValue="all">
            <SelectTrigger className="w-44" data-testid="filter-status">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="need_changes">Need Changes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24"/>)}</div>
        ) : filtered?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">No theses found</p>
              <p className="text-sm text-muted-foreground mt-1">No submissions match the current filter.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered?.map((thesis) => {
              const cfg = statusConfig[thesis.status];
              const Icon = cfg.icon;
              const student = users?.find(u => u.id === thesis.studentId);
              return (
                <Link key={thesis.id} href={`/supervisor/theses/${thesis.id}`}>
                  <Card className="cursor-pointer hover-elevate" data-testid={`thesis-row-${thesis.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${cfg.color.split(" ").slice(0,2).join(" ")}`}>
                          <Icon className={`w-5 h-5 ${cfg.color.split(" ").slice(2).join(" ")}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground text-sm truncate">{thesis.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{student?.name || "Unknown"}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">{new Date(thesis.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-sm ${cfg.color}`}>
                            <Icon className="w-3 h-3" />{cfg.label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
