import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { QueryError } from "@/components/QueryError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EMPLOYMENT_STATUS } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/payroll")({
  head: () => ({
    meta: [
      { title: "Payroll Management — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Monthly teaching-service payroll position by state and employment category, drawn from the teacher register.",
      },
      { property: "og:title", content: "Payroll Management — MoGEI" },
      { property: "og:description", content: "Teaching service payroll position by state." },
    ],
  }),
  component: PayrollPage,
});

const ssp = (n: number) => `SSP ${Math.round(n).toLocaleString()}`;

function PayrollPage() {
  const { data, isError, error, refetch } = useQuery({
    queryKey: ["payroll"],
    queryFn: async () => {
      const [teachers, schools] = await Promise.all([
        supabase.from("teachers").select("school_id, employment_status, monthly_salary, status"),
        supabase.from("schools").select("id, state"),
      ]);
      if (teachers.error) throw teachers.error;
      if (schools.error) throw schools.error;
      return { teachers: teachers.data ?? [], schools: schools.data ?? [] };
    },
  });

  const teachers = (data?.teachers ?? []).filter((t) => t.status !== "Retired");
  const schools = data?.schools ?? [];
  const stateOf = (id: string | null) => schools.find((s) => s.id === id)?.state ?? "Unassigned";

  const total = teachers.reduce((sum, t) => sum + Number(t.monthly_salary ?? 0), 0);
  const average = teachers.length ? total / teachers.length : 0;

  const byState = Object.entries(
    teachers.reduce<Record<string, { count: number; cost: number }>>((acc, t) => {
      const key = stateOf(t.school_id);
      acc[key] ??= { count: 0, cost: 0 };
      acc[key].count += 1;
      acc[key].cost += Number(t.monthly_salary ?? 0);
      return acc;
    }, {}),
  ).sort((a, b) => b[1].cost - a[1].cost);

  const byCategory = EMPLOYMENT_STATUS.map((cat) => {
    const rows = teachers.filter((t) => t.employment_status === cat);
    return {
      cat,
      count: rows.length,
      cost: rows.reduce((s, t) => s + Number(t.monthly_salary ?? 0), 0),
    };
  }).filter((r) => r.count);

  return (
    <AppShell
      title="Payroll Management System"
      subtitle="Monthly teaching-service wage bill compiled from the teacher register"
    >
      {isError && (
        <div className="mb-5">
          <QueryError error={error} what="payroll data" onRetry={() => refetch()} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Staff on payroll", value: teachers.length.toLocaleString() },
          { label: "Monthly wage bill", value: ssp(total) },
          { label: "Average salary", value: ssp(average) },
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

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Wage bill by state</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Monthly cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byState.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      No teachers on the payroll yet.
                    </TableCell>
                  </TableRow>
                )}
                {byState.map(([state, v]) => (
                  <TableRow key={state}>
                    <TableCell>{state}</TableCell>
                    <TableCell>{v.count}</TableCell>
                    <TableCell>{ssp(v.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">By employment category</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Monthly cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCategory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      No payroll categories to report.
                    </TableCell>
                  </TableRow>
                )}
                {byCategory.map((r) => (
                  <TableRow key={r.cat}>
                    <TableCell>{r.cat}</TableCell>
                    <TableCell>{r.count}</TableCell>
                    <TableCell>{ssp(r.cost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
