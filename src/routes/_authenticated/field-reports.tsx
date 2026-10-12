import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useSchoolLookup } from "@/hooks/useLookups";
import { RecordManager, today, type Column, type Field } from "@/components/RecordManager";
import { Badge } from "@/components/ui/badge";
import { FIELD_REPORT_STATUS, FIELD_REPORT_TYPES, STATES } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/field-reports")({
  head: () => ({
    meta: [
      { title: "Field Reporting — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Low-bandwidth field reports submitted by county education officers from school visits.",
      },
      { property: "og:title", content: "Field Reporting — MoGEI" },
      { property: "og:description", content: "County officer field data collection." },
    ],
  }),
  component: FieldReportsPage,
});

type ReportRow = {
  id: string;
  reference: string;
  report_type: string;
  school_id: string | null;
  state: string | null;
  county: string | null;
  officer_name: string | null;
  reported_on: string;
  learners_present: number;
  teachers_present: number;
  status: string;
};

const opts = (l: string[]) => l.map((v) => ({ value: v, label: v }));

function FieldReportsPage() {
  const { options: schoolOptions, nameOf: schoolName } = useSchoolLookup();

  const fields: Field[] = [
    { name: "reference", label: "Report reference", required: true, placeholder: "e.g. FR/2026/0231" },
    { name: "report_type", label: "Report type", type: "select", options: opts(FIELD_REPORT_TYPES), defaultValue: FIELD_REPORT_TYPES[0], required: true },
    {
      name: "school_id",
      label: "School visited",
      type: "select",
      options: schoolOptions,
      span: 2,
    },
    { name: "state", label: "State", type: "select", options: opts(STATES) },
    { name: "county", label: "County" },
    { name: "officer_name", label: "Reporting officer" },
    { name: "reported_on", label: "Date of visit", type: "date", defaultValue: today(), required: true },
    { name: "status", label: "Status", type: "select", options: opts(FIELD_REPORT_STATUS), defaultValue: "Submitted", required: true },
    { name: "learners_present", label: "Learners present", type: "number", defaultValue: 0, min: 0 },
    { name: "teachers_present", label: "Teachers present", type: "number", defaultValue: 0, min: 0 },
    { name: "observations", label: "Observations", type: "textarea", span: 2 },
  ];

  const columns: Column<ReportRow>[] = [
    { key: "reference", header: "Reference" },
    { key: "report_type", header: "Type" },
    { key: "school_id", header: "School", render: (r) => schoolName(r.school_id) },
    { key: "state", header: "State" },
    { key: "county", header: "County" },
    { key: "officer_name", header: "Officer" },
    { key: "reported_on", header: "Date" },
    { key: "learners_present", header: "Learners" },
    { key: "teachers_present", header: "Teachers" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "Verified" ? "default" : "secondary"}>{r.status}</Badge>
      ),
    },
  ];

  return (
    <AppShell
      title="Mobile & Field Reporting (MOB)"
      subtitle="Low-bandwidth data collection by county education officers"
    >
      <RecordManager<ReportRow>
        table="field_reports"
        singular="Field report"
        fields={fields}
        columns={columns}
        searchKeys={["reference", "report_type", "state", "county", "officer_name", "observations"]}
        emptyHint="No field reports submitted yet."
      />
    </AppShell>
  );
}
