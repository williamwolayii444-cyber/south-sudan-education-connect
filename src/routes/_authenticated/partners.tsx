import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { MessageSquare, Plus, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RecordManager, today, type Column, type Field } from "@/components/RecordManager";
import { QueryError } from "@/components/QueryError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/hooks/useSession";
import {
  PARTNER_REPORT_STATUS,
  PARTNER_REPORT_TYPES,
  PARTNER_STATUS,
  PARTNER_TYPES,
  STATES,
} from "@/lib/moges";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/partners")({
  head: () => ({
    meta: [
      { title: "Partners of GEI — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Partners of General Education and Instruction — shared reports, programme updates and reply threads.",
      },
      { property: "og:title", content: "Partners of GEI — MoGEI" },
      {
        property: "og:description",
        content: "Partner directory, shared reports and ministry–partner replies.",
      },
    ],
  }),
  component: PartnersPage,
});

type PartnerRow = {
  id: string;
  code: string;
  name: string;
  partner_type: string;
  contact_name: string | null;
  contact_email: string | null;
  focus_areas: string | null;
  states_covered: string | null;
  status: string;
};

type ReportRow = {
  id: string;
  reference: string;
  title: string;
  report_type: string;
  partner_id: string | null;
  period_label: string | null;
  state: string | null;
  summary: string | null;
  body: string | null;
  status: string;
  published_on: string | null;
  created_at: string;
};

type ReplyRow = {
  id: string;
  report_id: string;
  author_name: string;
  author_side: string;
  body: string;
  created_at: string;
  created_by: string | null;
};

const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }));

const emptyReportForm = {
  reference: "",
  title: "",
  report_type: PARTNER_REPORT_TYPES[0],
  partner_id: "",
  period_label: "",
  state: "",
  summary: "",
  body: "",
  status: "Shared",
  published_on: "",
};

function PartnersPage() {
  return (
    <AppShell
      title="Partners of General Education & Instruction"
      subtitle="Partner directory, shared sector reports, and reply threads with MoGEI"
    >
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">Shared reports & replies</TabsTrigger>
          <TabsTrigger value="directory">Partner directory</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="space-y-4">
          <PartnerReportsWorkspace />
        </TabsContent>
        <TabsContent value="directory">
          <PartnerDirectory />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function PartnerDirectory() {
  const fields: Field[] = [
    { name: "code", label: "Partner code", required: true, placeholder: "e.g. GPE / UNICEF" },
    { name: "name", label: "Organisation name", required: true, span: 2 },
    {
      name: "partner_type",
      label: "Partner type",
      type: "select",
      options: opts(PARTNER_TYPES),
      defaultValue: PARTNER_TYPES[0],
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: opts(PARTNER_STATUS),
      defaultValue: "Active",
      required: true,
    },
    { name: "contact_name", label: "Primary contact" },
    { name: "contact_email", label: "Contact email", type: "email" },
    { name: "states_covered", label: "States covered", span: 2, placeholder: "e.g. Jonglei, Unity" },
    { name: "focus_areas", label: "Focus areas", type: "textarea", span: 2 },
    { name: "notes", label: "Notes", type: "textarea", span: 2 },
  ];

  const columns: Column<PartnerRow>[] = [
    { key: "code", header: "Code" },
    { key: "name", header: "Partner" },
    { key: "partner_type", header: "Type" },
    { key: "contact_name", header: "Contact" },
    { key: "states_covered", header: "Coverage" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "Active" ? "default" : "secondary"}>{r.status}</Badge>
      ),
    },
  ];

  return (
    <RecordManager<PartnerRow>
      table="partners"
      singular="Partner"
      fields={fields}
      columns={columns}
      searchKeys={["code", "name", "partner_type", "contact_name", "focus_areas", "states_covered"]}
      emptyHint="No partners registered yet. Add development partners, UN agencies and NGOs here."
    />
  );
}

function PartnerReportsWorkspace() {
  const queryClient = useQueryClient();
  const { canWrite } = useRoles();
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReportRow | null>(null);
  const [form, setForm] = useState(emptyReportForm);
  const [replyBody, setReplyBody] = useState("");
  const [replySide, setReplySide] = useState("Partner");

  const { data: partners = [] } = useQuery({
    queryKey: ["partners", "lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, code, name, status")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const {
    data: reports = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["partner_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
  });

  const selected = reports.find((r) => r.id === selectedId) ?? reports[0] ?? null;
  const activeId = selected?.id ?? null;

  const { data: replies = [] } = useQuery({
    queryKey: ["partner_report_replies", activeId],
    enabled: Boolean(activeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_report_replies")
        .select("*")
        .eq("report_id", activeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReplyRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      const partnerName = partners.find((p) => p.id === r.partner_id)?.name ?? "";
      return [r.reference, r.title, r.report_type, r.state, r.summary, partnerName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [reports, search, statusFilter, partners]);

  const stats = useMemo(() => {
    const shared = reports.filter((r) => r.status === "Shared" || r.status === "Awaiting reply").length;
    const replied = reports.filter((r) => r.status === "Replied").length;
    const awaiting = reports.filter((r) => r.status === "Awaiting reply").length;
    return { total: reports.length, shared, replied, awaiting, partners: partners.length };
  }, [reports, partners]);

  const partnerName = (id: string | null) =>
    id ? (partners.find((p) => p.id === id)?.name ?? "—") : "All partners";

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyReportForm,
      published_on: today(),
      reference: `PR/${new Date().getFullYear()}/${String(reports.length + 1).padStart(4, "0")}`,
    });
    setFormOpen(true);
  }

  function openEdit(report: ReportRow) {
    setEditing(report);
    setForm({
      reference: report.reference,
      title: report.title,
      report_type: report.report_type,
      partner_id: report.partner_id ?? "",
      period_label: report.period_label ?? "",
      state: report.state ?? "",
      summary: report.summary ?? "",
      body: report.body ?? "",
      status: report.status,
      published_on: report.published_on ?? today(),
    });
    setFormOpen(true);
  }

  const saveReport = useMutation({
    mutationFn: async () => {
      const payload = {
        reference: form.reference.trim(),
        title: form.title.trim(),
        report_type: form.report_type,
        partner_id: form.partner_id || null,
        period_label: form.period_label.trim() || null,
        state: form.state || null,
        summary: form.summary.trim() || null,
        body: form.body.trim() || null,
        status: form.status,
        published_on: form.published_on || null,
      };
      if (!payload.reference || !payload.title) {
        throw new Error("Reference and title are required.");
      }
      if (editing) {
        const { error } = await supabase.from("partner_reports").update(payload).eq("id", editing.id);
        if (error) throw error;
        return editing.id;
      }
      const { data, error } = await supabase
        .from("partner_reports")
        .insert({ ...payload, created_by: user?.id ?? null })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["partner_reports"] });
      setFormOpen(false);
      setSelectedId(id);
      toast.success(editing ? "Report updated" : "Report shared with partners");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const postReply = useMutation({
    mutationFn: async () => {
      if (!activeId) throw new Error("Select a report first.");
      const body = replyBody.trim();
      if (!body) throw new Error("Write a reply before sending.");
      const author_name =
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Partner contact";
      const side = canWrite && replySide === "Ministry" ? "Ministry" : "Partner";
      const { error } = await supabase.from("partner_report_replies").insert({
        report_id: activeId,
        author_name,
        author_side: side,
        body,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyBody("");
      queryClient.invalidateQueries({ queryKey: ["partner_report_replies", activeId] });
      queryClient.invalidateQueries({ queryKey: ["partner_reports"] });
      toast.success("Reply posted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registered partners" value={stats.partners} />
        <Stat label="Shared reports" value={stats.total} />
        <Stat label="Awaiting reply" value={stats.awaiting} />
        <Stat label="Partner replies received" value={stats.replied} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports, partners, states…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PARTNER_REPORT_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Share report
          </Button>
        )}
      </div>

      {isError && <QueryError error={error} what="partner reports" onRetry={() => refetch()} />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="overflow-hidden rounded-sm border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-display text-base">Report inbox</h2>
            <p className="text-xs text-muted-foreground">
              Reports MoGEI shares with partners for review and reply
            </p>
          </div>
          <div className="max-h-[34rem] divide-y overflow-y-auto">
            {isLoading && <p className="px-4 py-8 text-sm text-muted-foreground">Loading reports…</p>}
            {!isLoading && filtered.length === 0 && (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                No shared reports yet. Officers can publish a report for partners to review and reply.
              </p>
            )}
            {filtered.map((report) => {
              const active = report.id === activeId;
              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedId(report.id)}
                  className={cn(
                    "block w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    active && "bg-muted/70",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{report.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {report.reference} · {partnerName(report.partner_id)}
                      </p>
                    </div>
                    <Badge variant={report.status === "Replied" ? "default" : "secondary"}>
                      {report.status}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {report.summary || report.report_type}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border bg-card">
          {!selected ? (
            <div className="flex h-full min-h-80 items-center justify-center px-6 text-sm text-muted-foreground">
              Select a report to read it and post a reply.
            </div>
          ) : (
            <div className="flex h-full min-h-80 flex-col">
              <div className="space-y-3 border-b px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {selected.reference} · {selected.report_type}
                    </p>
                    <h3 className="mt-1 font-display text-xl leading-snug">{selected.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selected.status === "Replied" ? "default" : "secondary"}>
                      {selected.status}
                    </Badge>
                    {canWrite && (
                      <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>To: {partnerName(selected.partner_id)}</span>
                  {selected.period_label && <span>Period: {selected.period_label}</span>}
                  {selected.state && <span>State: {selected.state}</span>}
                  {selected.published_on && (
                    <span>Published: {format(parseISO(selected.published_on), "d MMM yyyy")}</span>
                  )}
                </div>
                {selected.summary && <p className="text-sm leading-relaxed">{selected.summary}</p>}
                {selected.body && (
                  <div className="rounded-sm border bg-muted/30 px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {selected.body}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="size-4" />
                  Replies ({replies.length})
                </div>
                {replies.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No replies yet. Partners can respond here after reviewing the report.
                  </p>
                )}
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={cn(
                      "rounded-sm border px-3 py-3",
                      reply.author_side === "Ministry" ? "border-primary/20 bg-primary/5" : "bg-card",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {reply.author_name}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {reply.author_side}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(reply.created_at), "d MMM yyyy · HH:mm")}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{reply.body}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t px-5 py-4">
                {canWrite && (
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground">Posting as</Label>
                    <Select value={replySide} onValueChange={setReplySide}>
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Partner">Partner</SelectItem>
                        <SelectItem value="Ministry">Ministry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write a reply to this report…"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => postReply.mutate()}
                    disabled={postReply.isPending || !replyBody.trim()}
                  >
                    <Send className="size-4" />
                    {postReply.isPending ? "Sending…" : "Send reply"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit shared report" : "Share report with partners"}</DialogTitle>
            <DialogDescription>
              Publish a sector report for a partner organisation to review and reply.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Report type</Label>
              <Select
                value={form.report_type}
                onValueChange={(v) => setForm((f) => ({ ...f, report_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_REPORT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Partner</Label>
              <Select
                value={form.partner_id || "all"}
                onValueChange={(v) => setForm((f) => ({ ...f, partner_id: v === "all" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All partners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All partners</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_REPORT_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Input
                id="period"
                placeholder="e.g. Q1 2026"
                value={form.period_label}
                onChange={(e) => setForm((f) => ({ ...f, period_label: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select
                value={form.state || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, state: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="National / all states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">National / all states</SelectItem>
                  {STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="published_on">Published on</Label>
              <Input
                id="published_on"
                type="date"
                value={form.published_on}
                onChange={(e) => setForm((f) => ({ ...f, published_on: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                rows={2}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="body">Full report</Label>
              <Textarea
                id="body"
                rows={6}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveReport.mutate()} disabled={saveReport.isPending}>
              {saveReport.isPending ? "Saving…" : editing ? "Save changes" : "Share report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border bg-card px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
