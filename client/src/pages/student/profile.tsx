import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, Building2, Calendar, Shield } from "lucide-react";
import type { Department } from "@shared/schema";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  contact: z.string().optional(),
  departmentId: z.string().optional(),
  batchYear: z.string().optional(),
});

export default function StudentProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: departments } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      contact: user?.contact || "",
      departmentId: user?.departmentId || "",
      batchYear: user?.batchYear?.toString() || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof profileSchema>) =>
      apiRequest("PATCH", "/api/users/me", { ...data, batchYear: data.batchYear ? parseInt(data.batchYear) : undefined }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/me"], updated);
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  const department = departments?.find(d => d.id === user?.departmentId);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your account information</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-sm font-medium capitalize">{user?.role}</span>
                  {department && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-sm">{department.code}</span>}
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input data-testid="input-profile-name" className="pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="space-y-2">
                    <FormLabel>Email Address</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-9 bg-muted" value={user?.email} disabled />
                    </div>
                  </div>
                  <FormField control={form.control} name="contact" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input data-testid="input-profile-contact" className="pl-9" placeholder="+880..." {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="departmentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-profile-dept">
                            <Building2 className="w-4 h-4 text-muted-foreground mr-2" />
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name} ({d.code})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="batchYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Year</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input data-testid="input-profile-batch" className="pl-9" placeholder="e.g. 2022" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" data-testid="button-save-profile" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Account Security</div>
                <div className="text-xs text-muted-foreground">Username: @{user?.username}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
