import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { QueryError } from "@/components/QueryError";
import { RecordManager, type Column, type Field } from "@/components/RecordManager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BUDGET_CATEGORIES, BUDGET_STATUS, FUNDING_SOURCES, STATES } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Financial Management — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Budgets, capitation grants, expenditure tracking and audit trail for the education sector.",
      },
      { property: "og:title", content: "Financial Management — MoGEI" },
      { property: "og:description", content: "Education sector budgets and expenditure." },
    ],
  }),
  component: FinancePage,
});

type BudgetRow = {
  id: string;
  code: string;
  title: string;
  fiscal_year: string;
  category: string;
  funding_source: string;
  state: string | null;
  allocated: number;
  spent: number;
  status: string;
};

const opts = (l: string[]) => l.map((v) => ({ value: v, label: v }));
const ssp = (n: number) => `SSP ${Math.round(n).toLocaleString()}`;

function FinancePage() {
  const {
    data: rows = [],
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["budget_lines", "totals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("budget_lines").select("allocated, spent");
      if (error) throw error;
      return data ?? [];
    },
  });

  const allocated = rows.reduce((s, r) => s + Number(r.allocated ?? 0), 0);
  const spent = rows.reduce((s, r) => s + Number(r.spent ?? 0), 0);
  const execution = allocated ? Math.round((spent / allocated) * 100) : 0;

  const fields: Field[] = [
    { name: "code", label: "Budget line code", required: true },
    { name: "fiscal_year", label: "Fiscal year", defaultValue: "2026/2027", required: true },
    { name: "title", label: "Budget line title", required: true, span: 2 },
    { name: "category", label: "Category", type: "select", options: opts(BUDGET_CATEGORIES), defaultValue: BUDGET_CATEGORIES[0], required: true },
    { name: "funding_source", label: "Funding source", type: "select", options: opts(FUNDING_SOURCES), defaultValue: FUNDING_SOURCES[0], required: true },
    { name: "state", label: "State", type: "select", options: opts(STATES) },
    { name: "status", label: "Status", type: "select", options: opts(BUDGET_STATUS), defaultValue: "Approved", required: true },
    { name: "allocated", label: "Allocated (SSP)", type: "number", defaultValue: 0, min: 0 },
    { name: "spent", label: "Expenditure to date (SSP)", type: "number", defaultValue: 0, min: 0 },
    { name: "notes", label: "Notes", type: "textarea", span: 2 },
  ];

  const columns: Column<BudgetRow>[] = [
    { key: "code", header: "Code" },
    { key: "title", header: "Budget line" },
    { key: "fiscal_year", header: "FY" },
    { key: "category", header: "Category" },
    { key: "funding_source", header: "Source" },
    { key: "state", header: "State" },
    { key: "allocated", header: "Allocated", render: (r) => ssp(Number(r.allocated ?? 0)) },
    { key: "spent", header: "Spent", render: (r) => ssp(Number(r.spent ?? 0)) },
    {
      key: "execution",
      header: "Execution",
      render: (r) =>
        Number(r.allocated) ? `${Math.round((Number(r.spent) / Number(r.allocated)) * 100)}%` : "—",
    },
    { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
  ];

  return (
    <AppShell
      title="Financial Management System (FMS)"
      subtitle="Budgets, capitation grants and expenditure tracking"
    >
      {isError && (
        <div className="mb-5">
          <QueryError error={error} what="budget totals" onRetry={() => refetch()} />
        </div>
      )}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total allocation", value: ssp(allocated) },
          { label: "Expenditure to date", value: ssp(spent) },
          { label: "Budget execution", value: `${execution}%` },
        ].map((c) => (
          <Card key={c.label} className="rounded-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-2xl">{c.value}</p>
              {c.label === "Budget execution" && (
                <Progress value={Math.min(execution, 100)} className="mt-3" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <RecordManager<BudgetRow>
        table="budget_lines"
        singular="Budget line"
        fields={fields}
        columns={columns}
        searchKeys={["code", "title", "category", "funding_source", "state", "fiscal_year"]}
        emptyHint="No budget lines captured for the current fiscal year."
      />
    </AppShell>
  );
}
