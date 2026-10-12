import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useSchoolLookup } from "@/hooks/useLookups";
import { RecordManager, today, type Column, type Field } from "@/components/RecordManager";
import { Badge } from "@/components/ui/badge";
import { INSPECTION_RATINGS, INSPECTION_STATUS, INSPECTION_TYPES } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/inspections")({
  head: () => ({
    meta: [
      { title: "Inspection & Quality Assurance — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "School inspection scheduling, findings, quality ratings and school improvement actions.",
      },
      { property: "og:title", content: "Inspection & Quality Assurance — MoGEI" },
      { property: "og:description", content: "School inspections, findings and improvement plans." },
    ],
  }),
  component: InspectionsPage,
});

type InspRow = {
  id: string;
  reference: string;
  school_id: string | null;
  inspection_type: string;
  inspector: string | null;
  visit_date: string;
  score: number;
  rating: string;
  status: string;
};

const opts = (l: string[]) => l.map((v) => ({ value: v, label: v }));

function InspectionsPage() {
  const { options: schoolOptions, nameOf: schoolName } = useSchoolLookup();

  const fields: Field[] = [
    { name: "reference", label: "Inspection reference", required: true, placeholder: "e.g. QA/2026/0087" },
    { name: "inspection_type", label: "Inspection type", type: "select", options: opts(INSPECTION_TYPES), defaultValue: "Routine", required: true },
    {
      name: "school_id",
      label: "School inspected",
      type: "select",
      options: schoolOptions,
      span: 2,
    },
    { name: "inspector", label: "Lead inspector" },
    { name: "visit_date", label: "Visit date", type: "date", defaultValue: today(), required: true },
    { name: "score", label: "Quality score (0–100)", type: "number", defaultValue: 0, min: 0, max: 100 },
    { name: "rating", label: "Rating", type: "select", options: opts(INSPECTION_RATINGS), defaultValue: "Satisfactory", required: true },
    { name: "status", label: "Status", type: "select", options: opts(INSPECTION_STATUS), defaultValue: "Scheduled", required: true },
    { name: "findings", label: "Findings", type: "textarea", span: 2 },
    { name: "actions", label: "Improvement actions agreed", type: "textarea", span: 2 },
  ];

  const columns: Column<InspRow>[] = [
    { key: "reference", header: "Reference" },
    { key: "school_id", header: "School", render: (r) => schoolName(r.school_id) },
    { key: "inspection_type", header: "Type" },
    { key: "inspector", header: "Inspector" },
    { key: "visit_date", header: "Visit date" },
    { key: "score", header: "Score" },
    {
      key: "rating",
      header: "Rating",
      render: (r) => (
        <Badge variant={r.rating === "Weak" || r.rating === "Critical" ? "destructive" : "default"}>
          {r.rating}
        </Badge>
      ),
    },
    { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
  ];

  return (
    <AppShell
      title="Inspection & Quality Assurance (IQA)"
      subtitle="Inspection scheduling, findings and school improvement plans"
    >
      <RecordManager<InspRow>
        table="inspections"
        singular="Inspection"
        fields={fields}
        columns={columns}
        searchKeys={["reference", "inspector", "inspection_type", "rating", "findings"]}
        emptyHint="No inspections scheduled or recorded yet."
      />
    </AppShell>
  );
}
