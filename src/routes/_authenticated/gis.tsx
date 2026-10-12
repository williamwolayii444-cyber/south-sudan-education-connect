import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { QueryError } from "@/components/QueryError";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/gis")({
  head: () => ({
    meta: [
      { title: "GIS & School Mapping — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Geo-located network of schools across the states, counties and payams of South Sudan.",
      },
      { property: "og:title", content: "GIS & School Mapping — MoGEI" },
      { property: "og:description", content: "Geo-located national school network." },
    ],
  }),
  component: GisPage,
});

type Row = {
  id: string;
  name: string;
  code: string;
  state: string;
  county: string | null;
  payam: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
};

function GisPage() {
  const {
    data: schools = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["gis-schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, code, state, county, payam, latitude, longitude, status")
        .order("state");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const grouped = schools.reduce<Record<string, Record<string, Row[]>>>((acc, s) => {
    const state = s.state || "Unassigned";
    const county = s.county || "Unassigned";
    (acc[state] ??= {})[county] ??= [];
    acc[state][county].push(s);
    return acc;
  }, {});
  const hasCoords = (s: Row) => s.latitude != null && s.longitude != null;
  const mapped = schools.filter(hasCoords).length;

  return (
    <AppShell
      title="GIS & School Mapping"
      subtitle={`${mapped} of ${schools.length} schools carry verified coordinates`}
    >
      {isError && (
        <div className="mb-5">
          <QueryError error={error} what="school locations" onRetry={() => refetch()} />
        </div>
      )}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading school network…</p>
      ) : schools.length === 0 ? (
        <Card className="rounded-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No schools registered yet. Coordinates captured in the School Management System appear
            here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(grouped).map(([state, counties]) => {
            const totalSchools = Object.values(counties).reduce((sum, rows) => sum + rows.length, 0);
            return (
              <Card key={state} className="soft-card rounded-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base">
                    {state}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {totalSchools} school{totalSchools === 1 ? "" : "s"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(counties).map(([county, rows]) => (
                    <div key={`${state}-${county}`} className="rounded-sm border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{county}</p>
                        <Badge variant="outline">{rows.length} school{rows.length === 1 ? "" : "s"}</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        {rows.map((s) => (
                          <div key={s.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium">{s.name}</p>
                              <Badge variant={s.status === "Active" ? "secondary" : "outline"}>
                                {s.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {[s.payam].filter(Boolean).join(" · ") || "Location not specified"}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" />
                              {hasCoords(s)
                                ? `${Number(s.latitude).toFixed(4)}, ${Number(s.longitude).toFixed(4)}`
                                : "Coordinates pending survey"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
