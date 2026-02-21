import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3, Building2, UserIcon } from "lucide-react";
import type { Department, User } from "@shared/schema";

const COLORS = ["hsl(217,91%,35%)", "hsl(217,80%,45%)", "hsl(195,85%,40%)", "hsl(240,75%,45%)", "hsl(280,70%,45%)"];

export default function AdminReports() {
  const { data: departments } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: deptStats, isLoading: deptLoading } = useQuery<{ departmentId: string | null; count: number }[]>({
    queryKey: ["/api/reports/department-stats"],
  });
  const { data: supStats, isLoading: supLoading } = useQuery<{ supervisorId: string | null; count: number }[]>({
    queryKey: ["/api/reports/supervisor-stats"],
  });

  const deptChartData = deptStats?.map(s => ({
    name: s.departmentId ? (departments?.find(d => d.id === s.departmentId)?.code || "Unknown") : "No Dept",
    count: s.count,
  })) || [];

  const supChartData = supStats?.map(s => ({
    name: s.supervisorId ? (users?.find(u => u.id === s.supervisorId)?.name?.split(" ")[0] || "Unknown") : "Unassigned",
    count: s.count,
  })) || [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Analytics and statistics for the platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theses by Department */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Theses by Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deptLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : deptChartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No data available</p>
                </div>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: "6px", fontSize: "12px" }}
                        itemStyle={{ color: "hsl(var(--card-foreground))" }}
                        labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: "600" }}
                      />
                      <Bar dataKey="count" name="Theses" fill="hsl(217,91%,35%)" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews by Supervisor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
                Reviews by Supervisor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : supChartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No reviews yet</p>
                </div>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={supChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, count }) => `${name}: ${count}`} labelLine={false}>
                        {supChartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: "6px", fontSize: "12px" }}
                        itemStyle={{ color: "hsl(var(--card-foreground))" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              Department Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {departments?.length === 0 ? (
              <div className="px-4 pb-4 text-sm text-muted-foreground">No departments configured.</div>
            ) : (
              <div className="divide-y">
                <div className="grid grid-cols-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/30">
                  <span>Department</span>
                  <span className="text-center">Code</span>
                  <span className="text-right">Theses Submitted</span>
                </div>
                {departments?.map((dept) => {
                  const count = deptStats?.find(s => s.departmentId === dept.id)?.count ?? 0;
                  return (
                    <div key={dept.id} className="grid grid-cols-3 px-4 py-3 items-center" data-testid={`report-dept-${dept.id}`}>
                      <span className="text-sm font-medium text-foreground">{dept.name}</span>
                      <span className="text-sm text-muted-foreground text-center">{dept.code}</span>
                      <span className="text-sm font-semibold text-foreground text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
