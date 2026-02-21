import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, UserX, Plus, Search, Trash2, CheckCircle, Clock, Shield } from "lucide-react";
import type { User, Department } from "@shared/schema";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["student", "supervisor", "admin"]),
  departmentId: z.string().optional(),
});

export default function AdminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: departments } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/users/${id}/approve`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "Supervisor approved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "User deleted" }); setDeleteUserId(null); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const form = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", username: "", password: "", role: "student" as const, departmentId: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof createUserSchema>) => apiRequest("POST", "/api/users", { ...data, departmentId: data.departmentId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User created" });
      setShowCreate(false);
      form.reset();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = users?.filter(u => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const roleColors: Record<string, string> = {
    student: "bg-primary/10 text-primary",
    supervisor: "bg-accent text-accent-foreground",
    admin: "bg-destructive/10 text-destructive",
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Create, approve and manage platform users</p>
          </div>
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-user">
            <Plus className="w-4 h-4 mr-2" /> Create User
          </Button>
        </div>

        {/* Pending Approvals */}
        {users?.filter(u => u.role === "supervisor" && !u.isApproved).length ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" /> Pending Supervisor Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {users?.filter(u => u.role === "supervisor" && !u.isApproved).map(u => (
                  <div key={u.id} className="flex items-center gap-4 px-4 py-3" data-testid={`pending-user-${u.id}`}>
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                        {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveMutation.mutate(u.id)} disabled={approveMutation.isPending} data-testid={`button-approve-${u.id}`} className="bg-green-600 text-white">
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDeleteUserId(u.id)} className="border-destructive text-destructive" data-testid={`button-reject-${u.id}`}>
                        <UserX className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input data-testid="input-search-users" className="pl-9" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select onValueChange={setRoleFilter} defaultValue="all">
            <SelectTrigger className="w-40" data-testid="filter-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="supervisor">Supervisors</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14"/>)}</div>
            ) : filtered?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="font-medium text-foreground">No users found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filtered?.map(u => {
                  const initials = u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2);
                  const dept = departments?.find(d => d.id === u.departmentId);
                  return (
                    <div key={u.id} className="flex items-center gap-4 px-4 py-3" data-testid={`user-row-${u.id}`}>
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{u.name}</span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-sm capitalize ${roleColors[u.role]}`}>{u.role}</span>
                          {u.role === "supervisor" && !u.isApproved && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {u.email} {dept ? `· ${dept.code}` : ""} {u.batchYear ? `· Batch ${u.batchYear}` : ""}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteUserId(u.id)} data-testid={`button-delete-${u.id}`} className="text-muted-foreground w-8 h-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input data-testid="input-new-name" placeholder="John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input data-testid="input-new-username" placeholder="john_doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input data-testid="input-new-email" placeholder="user@university.edu" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input data-testid="input-new-password" type="password" placeholder="Min. 6 characters" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-new-role"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="departmentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-new-dept"><SelectValue placeholder="Optional" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" data-testid="button-confirm-create" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(o) => !o && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The user will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
