import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import StudentDashboard from "@/pages/student/dashboard";
import StudentTheses from "@/pages/student/theses";
import StudentProfile from "@/pages/student/profile";
import StudentFeedback from "@/pages/student/feedback";
import SupervisorDashboard from "@/pages/supervisor/dashboard";
import SupervisorTheses from "@/pages/supervisor/theses";
import SupervisorProfile from "@/pages/supervisor/profile";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminDepartments from "@/pages/admin/departments";
import AdminReports from "@/pages/admin/reports";
import type { User } from "@shared/schema";

type AuthUser = Omit<User, "password">;

function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser | null>({ queryKey: ["/api/auth/me"] });
  return { user, isLoading };
}

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Redirect to="/" />;
  if (roles && !roles.includes(user.role)) return <Redirect to="/" />;
  return <>{children}</>;
}

function AutoRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) {
    if (user.role === "student") return <Redirect to="/student" />;
    if (user.role === "supervisor") return <Redirect to="/supervisor" />;
    if (user.role === "admin") return <Redirect to="/admin" />;
  }
  return <AuthPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AutoRedirect} />

      <Route path="/student">
        <ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>
      </Route>
      <Route path="/student/theses/:id">
        <ProtectedRoute roles={["student"]}><StudentTheses /></ProtectedRoute>
      </Route>
      <Route path="/student/theses">
        <ProtectedRoute roles={["student"]}><StudentTheses /></ProtectedRoute>
      </Route>
      <Route path="/student/feedback">
        <ProtectedRoute roles={["student"]}><StudentFeedback /></ProtectedRoute>
      </Route>
      <Route path="/student/profile">
        <ProtectedRoute roles={["student"]}><StudentProfile /></ProtectedRoute>
      </Route>

      <Route path="/supervisor">
        <ProtectedRoute roles={["supervisor"]}><SupervisorDashboard /></ProtectedRoute>
      </Route>
      <Route path="/supervisor/theses/:id">
        <ProtectedRoute roles={["supervisor"]}><SupervisorTheses /></ProtectedRoute>
      </Route>
      <Route path="/supervisor/theses">
        <ProtectedRoute roles={["supervisor"]}><SupervisorTheses /></ProtectedRoute>
      </Route>
      <Route path="/supervisor/profile">
        <ProtectedRoute roles={["supervisor"]}><SupervisorProfile /></ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute roles={["admin"]}><AdminUsers /></ProtectedRoute>
      </Route>
      <Route path="/admin/departments">
        <ProtectedRoute roles={["admin"]}><AdminDepartments /></ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute roles={["admin"]}><AdminReports /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
