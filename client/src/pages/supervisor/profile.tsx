import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
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
import { User, Mail, Building2 } from "lucide-react";
import type { Department } from "@shared/schema";

const profileSchema = z.object({
  name: z.string().min(2),
  departmentId: z.string().optional(),
});

export default function SupervisorProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: departments } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", departmentId: user?.departmentId || "" },
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof profileSchema>) => apiRequest("PATCH", "/api/users/me", data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["/api/auth/me"], updated);
      toast({ title: "Profile updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "S";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your supervisor profile</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-sm mt-1 inline-block">Supervisor</span>
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
                          <Input data-testid="input-sup-name" className="pl-9" {...field} />
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
                  <FormField control={form.control} name="departmentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-sup-dept">
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
                </div>
                <div className="flex justify-end">
                  <Button type="submit" data-testid="button-save-sup-profile" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
