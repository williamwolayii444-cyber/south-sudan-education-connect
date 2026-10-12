import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { QueryError } from "@/components/QueryError";
import { useRoles, useSession, type AppRole } from "@/hooks/useSession";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/administration")({
  head: () => ({
    meta: [
      { title: "System Administration — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Manage ministry officers and their access rights across the Integrated Management System.",
      },
      { property: "og:title", content: "System Administration — MoGEI" },
      { property: "og:description", content: "Officer accounts and access rights." },
    ],
  }),
  component: AdministrationPage,
});

const ROLES: { value: AppRole; label: string; description: string }[] = [
  {
    value: "admin",
    label: "Administrator",
    description: "Full access, manages officer accounts and views the audit trail.",
  },
  {
    value: "officer",
    label: "Officer",
    description: "Creates, amends and removes records in every register.",
  },
  { value: "viewer", label: "Viewer", description: "Read-only access. Default for new accounts." },
];
const RANK: Record<AppRole, number> = { admin: 3, officer: 2, viewer: 1 };

type Officer = {
  id: string;
  full_name: string;
  email: string | null;
  job_title: string | null;
  duty_station: string | null;
  created_at: string;
  role: AppRole;
};

type PendingChange = { officer: Officer; role: AppRole };

function AdministrationPage() {
  const { isAdmin, loading: rolesLoading } = useRoles();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<PendingChange | null>(null);

  const officers = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, job_title, duty_station, created_at")
          .order("created_at", { ascending: true }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      const roleOf = new Map<string, AppRole>();
      for (const r of roles.data ?? []) {
        const current = roleOf.get(r.user_id);
        if (!current || RANK[r.role] > RANK[current]) roleOf.set(r.user_id, r.role);
      }
      return (profiles.data ?? []).map(
        (p): Officer => ({ ...p, role: roleOf.get(p.id) ?? "viewer" }),
      );
    },
  });

  const audit = useQuery({
    queryKey: ["audit_log"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ officer, role }: PendingChange) => {
      const { error } = await supabase.rpc("set_user_role", { _user_id: officer.id, _role: role });
      if (error) {
        // PostgREST reports a missing function as PGRST202.
        if (error.code === "PGRST202") {
          throw new Error(
            "Role management is not enabled on the database yet. Apply the latest Supabase migration (supabase/migrations/20261012120000_roles_audit_and_schema_fixes.sql).",
          );
        }
        throw error;
      }
    },
    onSuccess: (_d, { officer, role }) => {
      toast.success(`${officer.full_name || officer.email} is now ${role === "admin" ? "an" : "a"} ${role}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["audit_log"] });
      setPending(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = useMemo(() => officers.data ?? [], [officers.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) =>
      [o.full_name, o.email, o.job_title, o.duty_station, o.role].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [list, search]);

  const counts = useMemo(
    () =>
      ROLES.map((r) => ({ ...r, count: list.filter((o) => o.role === r.value).length })),
    [list],
  );
  const nameOf = (id: string | null) => {
    const o = id ? list.find((x) => x.id === id) : undefined;
    return o ? o.full_name || o.email || id : id;
  };

  return (
    <AppShell
      title="System Administration"
      subtitle="Officer accounts, access rights and the audit trail"
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {counts.map((r) => (
          <Card key={r.value} className="soft-card rounded-md">
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}s</p>
                <p className="font-display text-2xl tabular-nums">
                  {officers.isLoading ? "…" : r.count}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="officers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="officers">Officers</TabsTrigger>
          {isAdmin && <TabsTrigger value="audit">Audit trail</TabsTrigger>}
        </TabsList>

        <TabsContent value="officers" className="space-y-4">
          {!isAdmin && !rolesLoading && (
            <p className="rounded-md border border-dashed px-4 py-2.5 text-sm text-muted-foreground">
              Only administrators may change access rights.
            </p>
          )}
          {officers.isError && (
            <QueryError
              error={officers.error}
              what="officer accounts"
              onRetry={() => officers.refetch()}
            />
          )}

          <Card className="rounded-md">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle className="font-display text-base">Ministry officers</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, station…"
                  className="pl-9"
                  aria-label="Search officers"
                />
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Officer</TableHead>
                    <TableHead>Duty station</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-48">Access level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {officers.isLoading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!officers.isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        {search ? "No officers match this search." : "No officer accounts found."}
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((o) => {
                    const self = o.id === user?.id;
                    return (
                      <TableRow key={o.id}>
                        <TableCell>
                          <p className="font-medium">
                            {o.full_name || "—"}
                            {self && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                (you)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[o.email, o.job_title].filter(Boolean).join(" · ")}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">{o.duty_station || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(o.created_at), "d MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          {isAdmin && !self ? (
                            <Select
                              value={o.role}
                              onValueChange={(v) => setPending({ officer: o, role: v as AppRole })}
                              disabled={setRole.isPending}
                            >
                              <SelectTrigger className="h-8 w-40" aria-label={`Access level for ${o.full_name || o.email}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant={o.role === "admin" ? "default" : "secondary"}
                              className="capitalize"
                              title={self ? "You cannot change your own access level" : undefined}
                            >
                              {o.role}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="audit" className="space-y-4">
            {audit.isError && (
              <QueryError error={audit.error} what="the audit trail" onRetry={() => audit.refetch()} />
            )}
            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="font-display text-base">Recent activity</CardTitle>
                <p className="text-sm text-muted-foreground">
                  The latest 200 changes to registers and access rights.
                </p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Officer</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Register</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audit.isLoading && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    )}
                    {!audit.isLoading && (audit.data ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No activity recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {(audit.data ?? []).map((a) => {
                      const details = a.details as { from?: string[] | null; to?: string } | null;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {format(new Date(a.created_at), "d MMM yyyy, HH:mm")}
                          </TableCell>
                          <TableCell className="text-sm">{a.actor_email || nameOf(a.actor_id) || "System"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={a.action === "delete" ? "destructive" : "secondary"}
                              className="capitalize"
                            >
                              {a.action.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{a.entity.replace(/_/g, " ")}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {a.action === "role_change"
                              ? `${nameOf(a.entity_id)}: ${details?.from?.join(", ") || "none"} → ${details?.to ?? "?"}`
                              : a.entity_id}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && !setRole.isPending && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change access level?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending && (
                <>
                  <strong className="text-foreground">
                    {pending.officer.full_name || pending.officer.email}
                  </strong>{" "}
                  will change from <strong className="capitalize">{pending.officer.role}</strong> to{" "}
                  <strong className="capitalize">{pending.role}</strong>.{" "}
                  {ROLES.find((r) => r.value === pending.role)?.description} This change is recorded
                  in the audit trail.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={setRole.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={setRole.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pending) setRole.mutate(pending);
              }}
            >
              {setRole.isPending ? "Updating…" : "Confirm change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
