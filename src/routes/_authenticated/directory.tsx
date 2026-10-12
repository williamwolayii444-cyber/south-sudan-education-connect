import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone, Search, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { QueryError } from "@/components/QueryError";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCHOOL_LEVELS, STATES } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/directory")({
  head: () => ({
    meta: [
      { title: "School Directory — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Searchable directory of registered schools with head teacher and contact details for citizens and partners.",
      },
      { property: "og:title", content: "School Directory — MoGEI" },
      { property: "og:description", content: "Find a registered school in South Sudan." },
    ],
  }),
  component: DirectoryPage,
});

const ALL = "all";

function DirectoryPage() {
  const [q, setQ] = useState("");
  const [state, setState] = useState(ALL);
  const [level, setLevel] = useState(ALL);

  const {
    data: schools = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["schools", "directory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schools").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return schools.filter((s) => {
      if (state !== ALL && s.state !== state) return false;
      if (level !== ALL && s.level !== level) return false;
      if (!t) return true;
      return [s.name, s.code, s.state, s.county, s.payam, s.head_teacher].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(t),
      );
    });
  }, [schools, q, state, level]);

  return (
    <AppShell
      title="Citizen & Parent Portal (CIT)"
      subtitle="Searchable directory of registered schools and contact points"
    >
      <div className="soft-card mb-5 flex flex-wrap items-center gap-3 rounded-md p-4">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by school, code, county, payam or head teacher…"
            className="pl-9"
            aria-label="Search schools"
          />
        </div>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by state">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All states</SelectItem>
            {STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All levels</SelectItem>
            {SCHOOL_LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="tabular-nums">
          {filtered.length.toLocaleString()} {filtered.length === 1 ? "school" : "schools"}
        </Badge>
      </div>

      {isError && (
        <div className="mb-5">
          <QueryError error={error} what="the school directory" onRetry={() => refetch()} />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 && !isError ? (
        <Card className="rounded-md">
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            {schools.length === 0 ? "No schools are registered yet." : "No schools match these filters."}{" "}
            <Link to="/schools" className="text-nile underline underline-offset-2">
              Go to the school register
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.id} className="rounded-md transition-shadow hover:shadow-md">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-base leading-tight">{s.name}</h2>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                      {s.code} · {s.level} · {s.ownership}
                    </p>
                  </div>
                  <Badge variant={s.accredited ? "default" : "secondary"} className="shrink-0">
                    {s.accredited ? "Accredited" : "Provisional"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {[s.payam, s.county, s.state].filter(Boolean).join(", ") ||
                        "Location not recorded"}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserRound className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span>{s.head_teacher || "Head teacher not recorded"}</span>
                  </div>
                  {s.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span>
                        <a href={`tel:${s.phone}`} className="hover:underline">
                          {s.phone}
                        </a>
                      </span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 truncate">
                        <a href={`mailto:${s.email}`} className="hover:underline">
                          {s.email}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
