import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/QueryError";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";

export type FieldType = "text" | "number" | "date" | "select" | "textarea" | "switch" | "email";

export type Field = {
  name: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  defaultValue?: string | number | boolean;
  span?: 1 | 2;
  min?: number;
  max?: number;
  step?: number | "any";
};

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  /** Plain-text value for CSV export when `render` returns markup. */
  exportValue?: (row: T) => string | number | null | undefined;
};

type Row = Record<string, unknown>;

export type TableName =
  | "schools"
  | "teachers"
  | "students"
  | "exam_registrations"
  | "staff_actions"
  | "budget_lines"
  | "documents"
  | "inspections"
  | "curriculum_items"
  | "lessons"
  | "partners"
  | "partner_reports"
  | "field_reports";

const PAGE_SIZE = 25;
// Radix Select cannot use "" as an item value, so optional selects use a sentinel.
const NONE = "__none__";

/** Today's date as YYYY-MM-DD in the officer's local time zone. */
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isBlank(value: unknown) {
  return value === "" || value === undefined || value === null;
}

// Prevent spreadsheet formula injection when a register is opened in Excel.
function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function RecordManager<T extends Row>({
  table,
  singular,
  fields,
  columns,
  searchKeys,
  orderBy = "created_at",
  emptyHint,
}: {
  table: TableName;
  singular: string;
  fields: Field[];
  columns: Column<T>[];
  searchKeys: string[];
  orderBy?: string;
  emptyHint?: string;
}) {
  const queryClient = useQueryClient();
  const { canWrite, loading: rolesLoading } = useRoles();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<T | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});

  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [table, "register"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderBy, { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      searchKeys.some((k) =>
        String(row[k] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [data, search, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const save = useMutation({
    mutationFn: async ({ payload, id }: { payload: Record<string, unknown>; id?: string }) => {
      if (id) {
        const { error } = await supabase
          .from(table)
          .update(payload as never)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [table] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(id ? `${singular} record updated` : `${singular} record created`);
      setFormOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (row: T) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", row.id as string);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(`${singular} record removed`);
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    const initial: Record<string, unknown> = {};
    fields.forEach((f) => {
      initial[f.name] = f.defaultValue ?? (f.type === "switch" ? false : "");
    });
    setValues(initial);
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row: T) {
    const initial: Record<string, unknown> = {};
    fields.forEach((f) => {
      initial[f.name] = row[f.name] ?? (f.type === "switch" ? false : "");
    });
    setValues(initial);
    setEditing(row);
    setFormOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const creating = !editing;
    const payload: Record<string, unknown> = {};

    for (const f of fields) {
      let raw = values[f.name];
      if (typeof raw === "string") raw = raw.trim();

      if (f.type === "switch") {
        payload[f.name] = Boolean(raw);
        continue;
      }
      if (isBlank(raw)) {
        if (f.required) {
          toast.error(`${f.label} is required`);
          return;
        }
        // On create, leave blanks out so database defaults apply; on edit, clear the value.
        if (!creating) payload[f.name] = null;
        continue;
      }
      if (f.type === "number") {
        const n = Number(raw);
        if (!Number.isFinite(n)) {
          toast.error(`${f.label} must be a number`);
          return;
        }
        if ((f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max)) {
          toast.error(`${f.label} must be between ${f.min ?? "−∞"} and ${f.max ?? "∞"}`);
          return;
        }
        payload[f.name] = n;
      } else {
        payload[f.name] = raw;
      }
    }

    save.mutate({ payload, id: editing ? String(editing.id) : undefined });
  }

  function exportCsv() {
    const header = columns.map((c) => csvCell(c.header)).join(",");
    const lines = filtered.map((row) =>
      columns
        .map((c) => {
          if (c.exportValue) return csvCell(c.exportValue(row));
          if (c.render) {
            const rendered = c.render(row);
            if (typeof rendered === "string" || typeof rendered === "number") {
              return csvCell(rendered);
            }
          }
          return csvCell(row[c.key]);
        })
        .join(","),
    );
    // BOM so Excel opens UTF-8 names (e.g. accented characters) correctly.
    const blob = new Blob(["﻿" + [header, ...lines].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table}-register-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const colSpan = columns.length + (canWrite ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="soft-card flex flex-wrap items-center gap-3 rounded-md p-4">
        <div className="relative min-w-0 flex-1 basis-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={`Search ${singular.toLowerCase()} register…`}
            className="pl-9"
            aria-label={`Search ${singular.toLowerCase()} register`}
          />
        </div>
        <Badge variant="outline" className="tabular-nums">
          {filtered.length.toLocaleString()} {filtered.length === 1 ? "record" : "records"}
        </Badge>
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="size-4" /> Export CSV
        </Button>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New {singular.toLowerCase()}
          </Button>
        )}
      </div>

      {!canWrite && !rolesLoading && (
        <div className="flex items-center gap-2 rounded-md border border-dashed px-4 py-2.5 text-sm text-muted-foreground">
          <Eye className="size-4 shrink-0" />
          You have read-only access to this register. Ask an administrator for officer access to
          add or amend records.
        </div>
      )}

      {isError && <QueryError error={error} onRetry={() => refetch()} what={`${singular.toLowerCase()} records`} />}

      <div className="gov-panel overflow-x-auto rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((c) => (
                <TableHead key={c.key} className="whitespace-nowrap text-xs uppercase tracking-wide">
                  {c.header}
                </TableHead>
              ))}
              {canWrite && <TableHead className="w-24 text-right text-xs uppercase tracking-wide">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && !isError && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-12 text-center text-muted-foreground">
                  {search
                    ? `No ${singular.toLowerCase()} records match “${search}”.`
                    : (emptyHint ?? `No ${singular.toLowerCase()} records yet.`)}
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => (
              <TableRow key={String(row.id)}>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </TableCell>
                ))}
                {canWrite && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(row)}
                        aria-label={`Edit ${singular.toLowerCase()}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(row)}
                        aria-label={`Delete ${singular.toLowerCase()}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <span className="tabular-nums">
              Page {page + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing
                ? `Amend ${singular.toLowerCase()} record`
                : `Register new ${singular.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              Fields marked <span className="text-destructive">*</span> must be completed before the
              record is committed to the national register.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
            {fields.map((f) => (
              <div key={f.name} className={f.span === 2 ? "sm:col-span-2" : undefined}>
                <Label htmlFor={f.name} className="mb-1.5 block text-xs uppercase tracking-wide">
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>
                {f.type === "select" ? (
                  <Select
                    value={isBlank(values[f.name]) ? (f.required ? "" : NONE) : String(values[f.name])}
                    onValueChange={(v) =>
                      setValues((s) => ({ ...s, [f.name]: v === NONE ? "" : v }))
                    }
                  >
                    <SelectTrigger id={f.name} className="w-full">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {!f.required && (
                        <SelectItem value={NONE} className="text-muted-foreground">
                          — None —
                        </SelectItem>
                      )}
                      {f.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "textarea" ? (
                  <Textarea
                    id={f.name}
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    maxLength={2000}
                  />
                ) : f.type === "switch" ? (
                  <div className="flex h-9 items-center gap-2">
                    <Switch
                      id={f.name}
                      checked={Boolean(values[f.name])}
                      onCheckedChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
                    />
                    <span className="text-sm text-muted-foreground">{f.help}</span>
                  </div>
                ) : (
                  <Input
                    id={f.name}
                    type={
                      f.type === "number" || f.type === "date" || f.type === "email"
                        ? f.type
                        : "text"
                    }
                    value={String(values[f.name] ?? "")}
                    onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    maxLength={f.type === "number" || f.type === "date" ? undefined : 200}
                  />
                )}
                {f.help && f.type !== "switch" && (
                  <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>
                )}
              </div>
            ))}
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : editing ? "Save amendments" : "Commit record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this {singular.toLowerCase()} record?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the record from the national register. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={remove.isPending}
              onClick={(e) => {
                // Keep the dialog open until the delete finishes so failures stay visible.
                e.preventDefault();
                if (deleteTarget) remove.mutate(deleteTarget);
              }}
            >
              {remove.isPending ? "Removing…" : "Remove record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
