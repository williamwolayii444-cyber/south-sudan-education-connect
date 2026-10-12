import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATES } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/intelligence")({
  head: () => ({
    meta: [
      { title: "Business Intelligence & Reporting — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "State-by-state statistical returns on schools, learners, teachers and spending, exportable for ministry reporting.",
      },
      { property: "og:title", content: "Business Intelligence & Reporting — MoGEI" },
      { property: "og:description", content: "Statistical returns and exports for the sector." },
    ],
  }),
  component: BiPage,
});

function BiPage() {
  const { data, isError, error, refetch } = useQuery({
    queryKey: ["bi-core"],
    queryFn: async () => {
      const [schools, students, teachers, budgets] = await Promise.all([
        supabase.from("schools").select("id, state, capacity"),
        supabase.from("students").select("id, gender, school_id, status"),
        supabase.from("teachers").select("id, school_id, monthly_salary, status"),
        supabase.from("budget_lines").select("state, allocated, spent"),
      ]);
      for (const res of [schools, students, teachers, budgets]) {
        if (res.error) throw res.error;
      }
      return {
        schools: schools.data ?? [],
        students: students.data ?? [],
        teachers: teachers.data ?? [],
        budgets: budgets.data ?? [],
      };
    },
  });

  const schools = data?.schools ?? [];
  const students = (data?.students ?? []).filter((s) => s.status === "Enrolled");
  const teachers = (data?.teachers ?? []).filter((t) => t.status === "Active");
  const budgets = data?.budgets ?? [];

  const rows = STATES.map((state) => {
    const stateSchools = schools.filter((s) => s.state === state);
    const ids = new Set(stateSchools.map((s) => s.id));
    const stateStudents = students.filter((s) => s.school_id && ids.has(s.school_id));
    const stateTeachers = teachers.filter((t) => t.school_id && ids.has(t.school_id));
    const alloc = budgets
      .filter((b) => b.state === state)
      .reduce((a, b) => a + Number(b.allocated ?? 0), 0);
    return {
      state,
      schools: stateSchools.length,
      learners: stateStudents.length,
      girls: stateStudents.filter((s) => s.gender === "Female").length,
      teachers: stateTeachers.length,
      ptr: stateTeachers.length ? Math.round(stateStudents.length / stateTeachers.length) : 0,
      allocation: alloc,
    };
  }).filter((r) => r.schools || r.learners || r.teachers || r.allocation);

  const exportCsv = () => {
    const header = ["State", "Schools", "Learners", "Girls", "Teachers", "PTR", "Allocation (SSP)"];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [r.state, r.schools, r.learners, r.girls, r.teachers, r.ptr, r.allocation].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `mogei-statistical-return-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totals = rows.reduce(
    (acc, r) => ({
      schools: acc.schools + r.schools,
      learners: acc.learners + r.learners,
      teachers: acc.teachers + r.teachers,
      allocation: acc.allocation + r.allocation,
    }),
    { schools: 0, learners: 0, teachers: 0, allocation: 0 },
  );

  return (
    <AppShell
      title="Business Intelligence & Reporting (BI)"
      subtitle="Statistical returns by state, exportable for ministry and partner reporting"
    >
      {isError && (
        <div className="mb-5">
          <QueryError error={error} what="statistical returns" onRetry={() => refetch()} />
        </div>
      )}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Schools", value: totals.schools.toLocaleString() },
          { label: "Learners enrolled", value: totals.learners.toLocaleString() },
          { label: "Active teachers", value: totals.teachers.toLocaleString() },
          { label: "Allocation", value: `SSP ${totals.allocation.toLocaleString()}` },
        ].map((c) => (
          <Card key={c.label} className="rounded-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-3 flex justify-end">
        <Button onClick={exportCsv} className="rounded-sm" disabled={rows.length === 0}>
          Export statistical return (CSV)
        </Button>
      </div>

      <div className="overflow-x-auto rounded-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>State</TableHead>
              <TableHead>Schools</TableHead>
              <TableHead>Learners</TableHead>
              <TableHead>Girls</TableHead>
              <TableHead>Teachers</TableHead>
              <TableHead>PTR</TableHead>
              <TableHead>Allocation (SSP)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No data captured in the registries yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.state}>
                  <TableCell className="font-medium">{r.state}</TableCell>
                  <TableCell>{r.schools}</TableCell>
                  <TableCell>{r.learners}</TableCell>
                  <TableCell>{r.girls}</TableCell>
                  <TableCell>{r.teachers}</TableCell>
                  <TableCell>{r.ptr || "—"}</TableCell>
                  <TableCell>{r.allocation.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
