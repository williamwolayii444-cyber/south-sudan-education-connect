import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { QueryError } from "@/components/QueryError";
import { ChangePasswordDialog, initialsOf } from "@/components/UserProfile";
import { useMyProfile, useRoles } from "@/hooks/useSession";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIRECTORATES, STATES } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "My Profile — MoGEI South Sudan" }],
  }),
  component: ProfilePage,
});

const DUTY_STATIONS = ["Ministry headquarters, Juba", ...DIRECTORATES, ...STATES.map((s) => `${s} State Ministry`)];

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, user, isLoading, isError, error, refetch } = useMyProfile();
  const { roles } = useRoles();
  const [form, setForm] = useState({ full_name: "", job_title: "", duty_station: "" });
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      job_title: profile.job_title ?? "",
      duty_station: profile.duty_station ?? "",
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const full_name = form.full_name.trim();
      if (full_name.length < 2) throw new Error("Enter your full official name");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name,
          job_title: form.job_title.trim() || null,
          duty_station: form.duty_station || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dirty =
    !!profile &&
    (form.full_name !== (profile.full_name ?? "") ||
      form.job_title !== (profile.job_title ?? "") ||
      form.duty_station !== (profile.duty_station ?? ""));

  return (
    <AppShell title="My profile" subtitle="Your officer details and account security">
      {isError && <QueryError error={error} what="your profile" onRetry={() => refetch()} />}

      <div className="grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="font-display text-base">Officer details</CardTitle>
            <CardDescription>
              Shown to administrators and on records and partner replies you author.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="full_name">Full official name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  maxLength={120}
                  disabled={isLoading}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="job_title">Job title</Label>
                <Input
                  id="job_title"
                  value={form.job_title}
                  maxLength={120}
                  placeholder="e.g. County Education Director"
                  disabled={isLoading}
                  onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="duty_station">Duty station</Label>
                <Select
                  value={form.duty_station || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, duty_station: v }))}
                  disabled={isLoading}
                >
                  <SelectTrigger id="duty_station">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Keep a previously saved free-text value selectable. */}
                    {form.duty_station && !DUTY_STATIONS.includes(form.duty_station) && (
                      <SelectItem value={form.duty_station}>{form.duty_station}</SelectItem>
                    )}
                    {DUTY_STATIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" disabled={!dirty || save.isPending}>
                  {save.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-md">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg text-primary-foreground">
                {initialsOf(profile?.full_name, user?.email)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{profile?.full_name || "—"}</p>
                <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(roles.length ? roles : ["viewer"]).map((r) => (
                    <Badge key={r} variant="secondary" className="capitalize">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {profile?.created_at && (
                <p className="text-muted-foreground">
                  Account created {format(new Date(profile.created_at), "d MMMM yyyy")}
                </p>
              )}
              <Button variant="outline" className="w-full" onClick={() => setPasswordOpen(true)}>
                <KeyRound className="size-4" /> Change password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </AppShell>
  );
}
