import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { QueryError } from "@/components/QueryError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Early Warning — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Automated indicators and early-warning alerts on enrolment, staffing, quality and budget execution.",
      },
      { property: "og:title", content: "Analytics & Early Warning — MoGEI" },
      { property: "og:description", content: "Sector indicators and risk alerts." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data, isError, error, refetch } = useQuery({
    queryKey: ["analytics-core"],
    queryFn: async () => {
      const [students, teachers, schools, inspections, budgets] = await Promise.all([
        supabase.from("students").select("id, gender, status, school_id"),
        supabase.from("teachers").select("id, status, school_id, qualification"),
        supabase.from("schools").select("id, name, state, accredited"),
        supabase.from("inspections").select("id, school_id, rating, score"),
        supabase.from("budget_lines").select("allocated, spent"),
      ]);
      for (const res of [students, teachers, schools, inspections, budgets]) {
        if (res.error) throw res.error;
      }
      return {
        students: students.data ?? [],
        teachers: teachers.data ?? [],
        schools: schools.data ?? [],
        inspections: inspections.data ?? [],
        budgets: budgets.data ?? [],
      };
    },
  });

  // Indicators use enrolled learners and active teachers, matching the national dashboard.
  const students = (data?.students ?? []).filter((s) => s.status === "Enrolled");
  const teachers = (data?.teachers ?? []).filter((t) => t.status === "Active");
  const schools = data?.schools ?? [];
  const inspections = data?.inspections ?? [];
  const budgets = data?.budgets ?? [];

  const ptr = teachers.length ? Math.round(students.length / teachers.length) : 0;
  const girls = students.filter((s) => s.gender === "Female").length;
  const parity = students.length ? Math.round((girls / students.length) * 100) : 0;
  const allocated = budgets.reduce((a, b) => a + Number(b.allocated ?? 0), 0);
  const spent = budgets.reduce((a, b) => a + Number(b.spent ?? 0), 0);
  const execution = allocated ? Math.round((spent / allocated) * 100) : 0;

  const schoolsWithoutTeachers = schools.filter(
    (s) => !teachers.some((t) => t.school_id === s.id),
  );
  const weakInspections = inspections.filter((i) => i.rating === "Weak" || i.rating === "Critical");
  const unaccredited = schools.filter((s) => !s.accredited);

  const indicators = [
    { label: "Pupil–teacher ratio", value: ptr ? `${ptr}:1` : "—", note: "National target 50:1" },
    { label: "Female enrolment share", value: `${parity}%`, note: "Gender parity target 50%" },
    { label: "Budget execution", value: `${execution}%`, note: "Fiscal year to date" },
    { label: "Schools inspected", value: `${new Set(inspections.map((i) => i.school_id)).size}`, note: `of ${schools.length} registered` },
  ];

  const alerts = [
    {
      title: "Schools with no active teacher posted",
      count: schoolsWithoutTeachers.length,
      detail: schoolsWithoutTeachers.slice(0, 5).map((s) => s.name).join(", "),
      severity: schoolsWithoutTeachers.length > 0 ? "High" : "Clear",
    },
    {
      title: "Weak or critical inspection ratings",
      count: weakInspections.length,
      detail: "Requires school improvement follow-up within 30 days",
      severity: weakInspections.length > 0 ? "High" : "Clear",
    },
    {
      title: "Schools awaiting accreditation",
      count: unaccredited.length,
      detail: "Provisional registration pending quality assurance visit",
      severity: unaccredited.length > 0 ? "Medium" : "Clear",
    },
    {
      title: "Budget under-execution",
      count: execution < 40 && allocated > 0 ? 1 : 0,
      detail: `Execution at ${execution}% of allocation`,
      severity: execution < 40 && allocated > 0 ? "Medium" : "Clear",
    },
  ];

  return (
    <AppShell
      title="Analytics & Early Warning (AI)"
      subtitle="Automated sector indicators and risk alerts drawn from live registries"
    >
      {isError && (
        <div className="mb-5">
          <QueryError error={error} what="sector indicators" onRetry={() => refetch()} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicators.map((i) => (
          <Card key={i.label} className="soft-card rounded-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                {i.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{i.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{i.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 mb-3 font-display text-lg">Early warning alerts</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {alerts.map((a) => (
          <Card key={a.title} className="soft-card rounded-sm">
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.detail || "No records"}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl">{a.count}</p>
                <Badge variant={a.severity === "Clear" ? "secondary" : "destructive"}>
                  {a.severity}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
