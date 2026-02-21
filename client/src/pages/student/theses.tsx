import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BookOpen, Plus, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, History, MessageSquare, Upload, FileText, ArrowLeft } from "lucide-react";
import type { Thesis, ThesisVersion, Feedback } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  submitted:    { label: "Submitted",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",    icon: Clock },
  approved:     { label: "Approved",     color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  rejected:     { label: "Rejected",     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",        icon: XCircle },
  need_changes: { label: "Need Changes", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: AlertCircle },
};

const submitSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  abstract: z.string().min(20, "Abstract must be at least 20 characters"),
  fileName: z.string().min(1, "Please provide a file name"),
});

function SubmitDialog({ open, onClose, thesisId, isResubmit }: { open: boolean; onClose: () => void; thesisId?: string; isResubmit?: boolean }) {
  const { toast } = useToast();
  const form = useForm({ resolver: zodResolver(submitSchema), defaultValues: { title: "", abstract: "", fileName: "" } });

  const submitMutation = useMutation({
    mutationFn: (data: z.infer<typeof submitSchema>) =>
      isResubmit
        ? apiRequest("POST", `/api/theses/${thesisId}/resubmit`, data)
        : apiRequest("POST", "/api/theses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/theses"] });
      toast({ title: isResubmit ? "Resubmitted!" : "Submitted!", description: "Your thesis has been submitted." });
      onClose();
      form.reset();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isResubmit ? "Resubmit Thesis" : "Submit New Thesis"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Thesis Title</FormLabel>
                <FormControl>
                  <Input data-testid="input-thesis-title" placeholder="Enter your thesis title..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="abstract" render={({ field }) => (
              <FormItem>
                <FormLabel>Abstract</FormLabel>
                <FormControl>
                  <Textarea data-testid="input-thesis-abstract" placeholder="Provide a summary of your research..." className="min-h-[100px] resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="fileName" render={({ field }) => (
              <FormItem>
                <FormLabel>File Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input data-testid="input-thesis-file" className="pl-9" placeholder="thesis_final.pdf" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" data-testid="button-confirm-submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Submitting..." : isResubmit ? "Resubmit" : "Submit Thesis"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ThesisDetail({ id }: { id: string }) {
  const [showResubmit, setShowResubmit] = useState(false);
  const { data: thesis, isLoading } = useQuery<Thesis>({ queryKey: [`/api/theses/${id}`] });
  const { data: versions } = useQuery<ThesisVersion[]>({ queryKey: [`/api/theses/${id}/versions`] });
  const { data: feedbacks } = useQuery<Feedback[]>({ queryKey: [`/api/theses/${id}/feedback`] });

  if (isLoading) return <AppLayout><div className="max-w-3xl mx-auto space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div></AppLayout>;
  if (!thesis) return <AppLayout><div>Not found</div></AppLayout>;

  const cfg = statusConfig[thesis.status];
  const Icon = cfg.icon;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/student/theses">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg">{thesis.title}</CardTitle>
                <CardDescription className="mt-1 text-xs">Submitted {new Date(thesis.createdAt).toLocaleDateString()} · Version {thesis.currentVersion}</CardDescription>
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
            {(thesis.status === "need_changes" || thesis.status === "rejected") && (
              <Button size="sm" onClick={() => setShowResubmit(true)} data-testid="button-resubmit">
                <Upload className="w-4 h-4 mr-2" /> Resubmit Updated Version
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Version History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4" /> Version History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {versions?.length === 0 ? (
              <div className="px-4 pb-4 text-sm text-muted-foreground">No version history available.</div>
            ) : (
              <div className="divide-y">
                {versions?.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3" data-testid={`version-${v.version}`}>
                    <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">v{v.version} — {v.fileName}</div>
                      <div className="text-xs text-muted-foreground">{new Date(v.submittedAt).toLocaleString()}</div>
                    </div>
                    {v.version === thesis.currentVersion && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm font-medium">Current</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Supervisor Feedback</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {feedbacks?.length === 0 ? (
              <div className="px-4 pb-4 text-sm text-muted-foreground">No feedback yet from your supervisor.</div>
            ) : (
              <div className="divide-y">
                {feedbacks?.map((fb) => (
                  <div key={fb.id} className="px-4 py-3" data-testid={`feedback-${fb.id}`}>
                    <p className="text-sm text-foreground">{fb.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(fb.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <SubmitDialog open={showResubmit} onClose={() => setShowResubmit(false)} thesisId={thesis.id} isResubmit />
    </AppLayout>
  );
}

export default function StudentTheses() {
  const [match, params] = useRoute("/student/theses/:id");
  const [showSubmit, setShowSubmit] = useState(false);
  const { data: theses, isLoading } = useQuery<Thesis[]>({ queryKey: ["/api/theses"] });

  if (match && params?.id) return <ThesisDetail id={params.id} />;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Theses</h1>
            <p className="text-muted-foreground text-sm mt-0.5">All your thesis submissions</p>
          </div>
          <Button onClick={() => setShowSubmit(true)} data-testid="button-new-thesis">
            <Plus className="w-4 h-4 mr-2" /> Submit New Thesis
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : theses?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">No theses yet</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs">Start your academic journey by submitting your first thesis proposal.</p>
              <Button className="mt-4" onClick={() => setShowSubmit(true)} data-testid="button-first-thesis">
                <Plus className="w-4 h-4 mr-2" /> Submit Your First Thesis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {theses?.map((thesis) => {
              const cfg = statusConfig[thesis.status];
              const Icon = cfg.icon;
              return (
                <Link key={thesis.id} href={`/student/theses/${thesis.id}`}>
                  <Card className="cursor-pointer hover-elevate" data-testid={`thesis-card-${thesis.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground text-sm truncate">{thesis.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{thesis.abstract}</div>
                          <div className="text-xs text-muted-foreground mt-1">Version {thesis.currentVersion} · {new Date(thesis.updatedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-sm ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
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
      <SubmitDialog open={showSubmit} onClose={() => setShowSubmit(false)} />
    </AppLayout>
  );
}
