import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import type { Department } from "@shared/schema";

const deptSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required").max(10),
  description: z.string().optional(),
});

function DeptDialog({ open, onClose, dept }: { open: boolean; onClose: () => void; dept?: Department }) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: dept?.name || "", code: dept?.code || "", description: dept?.description || "" },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof deptSchema>) =>
      dept
        ? apiRequest("PATCH", `/api/departments/${dept.id}`, data)
        : apiRequest("POST", "/api/departments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: dept ? "Department updated" : "Department created" });
      onClose();
      form.reset();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{dept ? "Edit Department" : "Add Department"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl><Input data-testid="input-dept-name" placeholder="Computer Science & Eng." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl><Input data-testid="input-dept-code" placeholder="CSE" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea data-testid="input-dept-desc" placeholder="Brief description..." className="resize-none" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" data-testid="button-save-dept" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : dept ? "Update" : "Create Department"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDepartments() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deleteDeptId, setDeleteDeptId] = useState<string | null>(null);

  const { data: departments, isLoading } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/departments/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Department deleted" });
      setDeleteDeptId(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Departments</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage academic departments</p>
          </div>
          <Button onClick={() => setShowAdd(true)} data-testid="button-add-dept">
            <Plus className="w-4 h-4 mr-2" /> Add Department
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16"/>)}</div>
            ) : departments?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="font-medium text-foreground">No departments yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add your first department to get started.</p>
                <Button className="mt-4" onClick={() => setShowAdd(true)} data-testid="button-first-dept">
                  <Plus className="w-4 h-4 mr-2" /> Add Department
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {departments?.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-4 px-4 py-4" data-testid={`dept-row-${dept.id}`}>
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{dept.name}</span>
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm font-medium">{dept.code}</span>
                      </div>
                      {dept.description && <p className="text-xs text-muted-foreground mt-0.5">{dept.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => setEditDept(dept)} data-testid={`button-edit-dept-${dept.id}`} className="w-8 h-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteDeptId(dept.id)} data-testid={`button-delete-dept-${dept.id}`} className="w-8 h-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeptDialog open={showAdd} onClose={() => setShowAdd(false)} />
      {editDept && <DeptDialog open={!!editDept} onClose={() => setEditDept(null)} dept={editDept} />}

      <AlertDialog open={!!deleteDeptId} onOpenChange={(o) => !o && setDeleteDeptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this department. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDeptId && deleteMutation.mutate(deleteDeptId)} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete-dept">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
