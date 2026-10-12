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
import { CLASS_LEVELS, STATES } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/emis")({
  head: () => ({
    meta: [
      { title: "EMIS Statistics — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Education Management Information System: enrolment, staffing and school coverage statistics by state and class level.",
      },
      { property: "og:title", content: "EMIS Statistics — MoGEI" },
      { property: "og:description", content: "National enrolment and staffing statistics." },
    ],
  }),
  component: EmisPage,
});

type S = { id: string; state: string; level: string; status: string };

function EmisPage() {
  const { data, isError, error, refetch } = useQuery({
    queryKey: ["emis"],
    queryFn: async () => {
      const [schools, students, teachers] = await Promise.all([
        supabase.from("schools").select("id, state, level, status"),
        supabase.from("students").select("school_id, class_level, gender, status"),
        supabase.from("teachers").select("school_id, gender, status"),
      ]);
      if (schools.error) throw schools.error;
      if (students.error) throw students.error;
      if (teachers.error) throw teachers.error;
      return {
        schools: (schools.data ?? []) as S[],
        students: students.data ?? [],
        teachers: teachers.data ?? [],
      };
    },
  });

  const schools = data?.schools ?? [];
  const students = (data?.students ?? []).filter((s) => s.status === "Enrolled");
  const teachers = (data?.teachers ?? []).filter((t) => t.status === "Active");
  const stateOf = (schoolId: string | null) =>
    schools.find((s) => s.id === schoolId)?.state ?? "Unassigned";

  const stateRows = [...STATES, "Unassigned"]
    .map((state) => {
      const st = students.filter((s) => stateOf(s.school_id) === state);
      const te = teachers.filter((t) => stateOf(t.school_id) === state);
      return {
        state,
        schools: schools.filter((s) => s.state === state).length,
        learners: st.length,
        girls: st.filter((s) => s.gender === "Female").length,
        teachers: te.length,
        ratio: te.length ? Math.round(st.length / te.length) : 0,
      };
    })
    .filter((r) => r.schools || r.learners || r.teachers);

  const classRows = CLASS_LEVELS.map((level) => {
    const st = students.filter((s) => s.class_level === level);
    return {
      level,
      total: st.length,
      boys: st.filter((s) => s.gender === "Male").length,
      girls: st.filter((s) => s.gender === "Female").length,
    };
  }).filter((r) => r.total);

  return (
    <AppShell
      title="Education Management Information System (EMIS)"
      subtitle="Aggregated national statistics compiled from the live registries"
    >
      {isError && (
        <div className="mb-5">
          <QueryError error={error} what="EMIS statistics" onRetry={() => refetch()} />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Coverage by state</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>Schools</TableHead>
                  <TableHead>Learners</TableHead>
                  <TableHead>Girls</TableHead>
                  <TableHead>Teachers</TableHead>
                  <TableHead>PTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stateRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No data returned yet from the states.
                    </TableCell>
                  </TableRow>
                )}
                {stateRows.map((r) => (
                  <TableRow key={r.state}>
                    <TableCell>{r.state}</TableCell>
                    <TableCell>{r.schools}</TableCell>
                    <TableCell>{r.learners}</TableCell>
                    <TableCell>{r.girls}</TableCell>
                    <TableCell>{r.teachers}</TableCell>
                    <TableCell>{r.ratio ? `${r.ratio}:1` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-sm">
          <CardHeader>
            <CardTitle className="font-display text-base">Enrolment by class level</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Boys</TableHead>
                  <TableHead>Girls</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No learners enrolled yet.
                    </TableCell>
                  </TableRow>
                )}
                {classRows.map((r) => (
                  <TableRow key={r.level}>
                    <TableCell>{r.level}</TableCell>
                    <TableCell>{r.boys}</TableCell>
                    <TableCell>{r.girls}</TableCell>
                    <TableCell className="font-medium">{r.total}</TableCell>
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
