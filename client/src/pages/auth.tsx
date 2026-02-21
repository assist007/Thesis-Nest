import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BookOpen, GraduationCap, Lock, Mail, User, Phone, Building2, Calendar, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Department } from "@shared/schema";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "supervisor"]),
  departmentId: z.string().optional(),
  batchYear: z.string().optional(),
  contact: z.string().optional(),
});

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: departments } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

  const loginForm = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  const registerForm = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: "", email: "", username: "", password: "", role: "student" as const, departmentId: "", batchYear: "", contact: "" } });

  const loginMutation = useMutation({
    mutationFn: (data: z.infer<typeof loginSchema>) => apiRequest("POST", "/api/auth/login", data),
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      if (user.role === "student") navigate("/student");
      else if (user.role === "supervisor") navigate("/supervisor");
      else navigate("/admin");
    },
    onError: (e: Error) => toast({ title: "Login failed", description: e.message, variant: "destructive" }),
  });

  const registerMutation = useMutation({
    mutationFn: (data: z.infer<typeof registerSchema>) => apiRequest("POST", "/api/auth/register", {
      ...data,
      batchYear: data.batchYear ? parseInt(data.batchYear) : undefined,
      departmentId: data.departmentId || undefined,
    }),
    onSuccess: (res) => {
      toast({ title: "Account created!", description: res.message });
      setMode("login");
      registerForm.reset();
    },
    onError: (e: Error) => toast({ title: "Registration failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white" />
          <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-white" />
          <div className="absolute -bottom-16 left-1/3 w-64 h-64 rounded-full bg-white" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">ThesisNest</span>
          </div>
          <span className="text-primary-foreground/60 text-sm font-medium uppercase tracking-widest">THESYS Platform</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Streamline Your<br />Thesis Journey
            </h2>
            <p className="text-primary-foreground/75 text-lg leading-relaxed">
              A unified digital platform for thesis submission, review, and approval — connecting students, supervisors, and admins seamlessly.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: BookOpen, text: "Submit & track your thesis proposals" },
              { icon: User, text: "Real-time feedback from supervisors" },
              { icon: CheckCircle, text: "Streamlined approval workflow" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-md flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-primary-foreground/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-primary-foreground/40 text-xs">© 2026 ThesisNest (THESYS). All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ThesisNest</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {mode === "login" ? "Sign in to continue to your dashboard" : "Join ThesisNest today"}
            </p>
          </div>

          {/* Tab Switch */}
          <div className="flex bg-muted rounded-md p-1">
            <button
              data-testid="tab-login"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Sign In
            </button>
            <button
              data-testid="tab-register"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-sm transition-colors ${mode === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Register
            </button>
          </div>

          {mode === "login" ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))} className="space-y-4">
                <FormField control={loginForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input data-testid="input-email" className="pl-9" placeholder="you@university.edu" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={loginForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input data-testid="input-password" className="pl-9 pr-10" type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button data-testid="button-login" type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : (
                    <><span>Sign In</span><ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
                <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Demo Accounts:</p>
                  <p>Admin: admin@thesisnest.edu / admin123</p>
                  <p>Supervisor: supervisor@thesisnest.edu / super123</p>
                  <p>Student: student@thesisnest.edu / student123</p>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))} className="space-y-4">
                <FormField control={registerForm.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={registerForm.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input data-testid="input-name" className="pl-9" placeholder="John Doe" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={registerForm.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input data-testid="input-username" placeholder="john_doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={registerForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input data-testid="input-reg-email" className="pl-9" placeholder="you@university.edu" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={registerForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input data-testid="input-reg-password" className="pl-9" type="password" placeholder="Min. 6 characters" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={registerForm.control} name="departmentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="Select dept." />
                          </SelectTrigger>
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
                  <FormField control={registerForm.control} name="contact" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input data-testid="input-contact" className="pl-9" placeholder="+880..." {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                {registerForm.watch("role") === "student" && (
                  <FormField control={registerForm.control} name="batchYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Year</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input data-testid="input-batch" className="pl-9" placeholder="e.g. 2022" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <Button data-testid="button-register" type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                </Button>
                {registerForm.watch("role") === "supervisor" && (
                  <p className="text-xs text-muted-foreground text-center">
                    Supervisor accounts require admin approval before you can log in.
                  </p>
                )}
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
