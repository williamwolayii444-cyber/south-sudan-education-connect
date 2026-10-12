import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Lightweight id → label lookups used by register forms and tables.
// Keys are nested under the table name so RecordManager's invalidation of [table]
// refreshes them too, without colliding with the full-row register query.

export function useSchoolLookup() {
  const { data: schools = [] } = useQuery({
    queryKey: ["schools", "lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, code, state")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return useMemo(() => {
    const byId = new Map(schools.map((s) => [s.id, s]));
    return {
      schools,
      options: schools.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
      nameOf: (id: string | null | undefined, fallback = "—") =>
        (id ? byId.get(id)?.name : undefined) ?? fallback,
    };
  }, [schools]);
}

export function useStudentLookup() {
  const { data: students = [] } = useQuery({
    queryKey: ["students", "lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, code")
        .order("last_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return useMemo(
    () => ({
      students,
      options: students.map((s) => ({
        value: s.id,
        label: `${s.first_name} ${s.last_name} (${s.code})`,
      })),
    }),
    [students],
  );
}

export function useTeacherLookup() {
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers", "lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, first_name, last_name, code")
        .order("last_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return useMemo(() => {
    const byId = new Map(teachers.map((t) => [t.id, t]));
    return {
      teachers,
      options: teachers.map((t) => ({
        value: t.id,
        label: `${t.first_name} ${t.last_name} (${t.code})`,
      })),
      nameOf: (id: string | null | undefined, fallback = "—") => {
        const t = id ? byId.get(id) : undefined;
        return t ? `${t.first_name} ${t.last_name}` : fallback;
      },
    };
  }, [teachers]);
}
