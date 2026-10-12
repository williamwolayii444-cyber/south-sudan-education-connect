import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Users, School, Percent } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { buildGeoSummary } from "@/lib/geography";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "National Education Dashboard — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Live national indicators on learners, teachers and schools across the Republic of South Sudan.",
      },
      { property: "og:title", content: "National Education Dashboard — MoGEI" },
      { property: "og:description", content: "Live indicators for the national education system." },
    ],
  }),
  component: Dashboard,
});

type Student = {
  id: string;
  gender: string;
  class_level: string;
  school_id: string | null;
  status: string;
};
type Teacher = {
  id: string;
  gender: string;
  status: string;
  monthly_salary: number;
  school_id: string | null;
};
type SchoolRow = {
  id: string;
  name: string;
  state: string;
  county: string | null;
  level: string;
  capacity: number;
  status: string;
  accredited: boolean;
};

function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [students, teachers, schools] = await Promise.all([
        supabase.from("students").select("id, gender, class_level, school_id, status"),
        supabase.from("teachers").select("id, gender, status, monthly_salary, school_id"),
        supabase.from("schools").select("id, name, state, county, level, capacity, status, accredited"),
      ]);
      if (students.error) throw students.error;
      if (teachers.error) throw teachers.error;
      if (schools.error) throw schools.error;
      return {
        students: (students.data ?? []) as Student[],
        teachers: (teachers.data ?? []) as Teacher[],
        schools: (schools.data ?? []) as SchoolRow[],
      };
    },
  });
}

const PIE_COLORS = ["var(--color-chart-1)", "var(--color-chart-3)"];

function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useStats();

  const students = data?.students ?? [];
  const teachers = data?.teachers ?? [];
  const schools = data?.schools ?? [];

  const enrolled = students.filter((s) => s.status === "Enrolled");
  const activeTeachers = teachers.filter((t) => t.status === "Active");
  const girls = enrolled.filter((s) => s.gender === "Female").length;
  const ratio = activeTeachers.length ? Math.round(enrolled.length / activeTeachers.length) : 0;

  const byState = Object.entries(
    schools.reduce<Record<string, number>>((acc, s) => {
      acc[s.state || "Unassigned"] = (acc[s.state || "Unassigned"] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const genderSplit = [
    { name: "Boys", value: enrolled.length - girls },
    { name: "Girls", value: girls },
  ];

  const cards = [
    { label: "Learners enrolled", value: enrolled.length, icon: GraduationCap },
    { label: "Active teachers", value: activeTeachers.length, icon: Users },
    { label: "Schools registered", value: schools.length, icon: School },
    { label: "Pupil–teacher ratio", value: ratio ? `${ratio}:1` : "—", icon: Percent },
  ];

  const geoSummary = buildGeoSummary({ schools, students, teachers });

  return (
    <AppShell
      title="National Education Dashboard"
      subtitle="Live indicators drawn from the national registries"
    >
      {isError && (
        <div className="mb-5">
          <QueryError error={error} what="national indicators" onRetry={() => refetch()} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="soft-card rounded-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-normal uppercase tracking-wide text-muted-foreground">
                <c.icon className="size-4" /> {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl tabular-nums">
                {isLoading ? "…" : typeof c.value === "number" ? c.value.toLocaleString() : c.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="rounded-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base">Schools by state</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {byState.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byState}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="state" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "var(--color-muted)" }} />
                  <Bar dataKey="count" name="Schools" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-16 text-center text-sm text-muted-foreground">
                Register schools to populate this indicator.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Gender parity</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {enrolled.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderSplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} label>
                    {genderSplit.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-16 text-center text-sm text-muted-foreground">
                Enrol learners to populate this indicator.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="soft-card mt-5 rounded-sm">
        <CardHeader>
          <CardTitle className="font-display text-base">State and county coverage</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Schools</TableHead>
                <TableHead>Learners</TableHead>
                <TableHead>Teachers</TableHead>
                <TableHead>Counties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {geoSummary.length ? (
                geoSummary.map((row) => (
                  <TableRow key={row.state}>
                    <TableCell className="font-medium">{row.state}</TableCell>
                    <TableCell>{row.schools}</TableCell>
                    <TableCell>{row.learners}</TableCell>
                    <TableCell>{row.teachers}</TableCell>
                    <TableCell className="max-w-[320px] text-xs text-muted-foreground">
                      {row.counties.length
                        ? row.counties.map((county) => `${county.county} (${county.schools})`).join(", ")
                        : "No county data"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    Register schools, learners and teachers to populate state and county reporting.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
