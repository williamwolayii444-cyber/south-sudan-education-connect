import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RecordManager, type Column, type Field } from "@/components/RecordManager";
import { Badge } from "@/components/ui/badge";
import { OWNERSHIP, SCHOOL_LEVELS, SCHOOL_STATUS, STATES } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/schools")({
  head: () => ({
    meta: [
      { title: "School Management System — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Register, accredit and maintain every school in the national education register of South Sudan.",
      },
      { property: "og:title", content: "School Management System — MoGEI" },
      { property: "og:description", content: "National school register, accreditation and licensing." },
    ],
  }),
  component: SchoolsPage,
});

type SchoolRow = {
  id: string;
  code: string;
  name: string;
  level: string;
  ownership: string;
  state: string;
  county: string | null;
  capacity: number;
  accredited: boolean;
  status: string;
};

const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }));

const fields: Field[] = [
  { name: "code", label: "School code", required: true, placeholder: "e.g. CE-JUB-0142" },
  { name: "name", label: "School name", required: true, span: 2 },
  { name: "level", label: "Level", type: "select", options: opts(SCHOOL_LEVELS), defaultValue: "Primary", required: true },
  { name: "ownership", label: "Ownership", type: "select", options: opts(OWNERSHIP), defaultValue: "Public", required: true },
  { name: "state", label: "State", type: "select", options: opts(STATES), required: true },
  { name: "county", label: "County" },
  { name: "payam", label: "Payam" },
  { name: "head_teacher", label: "Head teacher" },
  { name: "phone", label: "Contact phone" },
  { name: "email", label: "Contact email", type: "email" },
  { name: "capacity", label: "Learner capacity", type: "number", defaultValue: 0, min: 0 },
  { name: "established_year", label: "Year established", type: "number", min: 1900, max: new Date().getFullYear() },
  // South Sudan lies roughly between 3°N–13°N and 23°E–36°E.
  { name: "latitude", label: "Latitude", type: "number", step: "any", min: -90, max: 90, placeholder: "e.g. 4.8594" },
  { name: "longitude", label: "Longitude", type: "number", step: "any", min: -180, max: 180, placeholder: "e.g. 31.5713" },
  { name: "status", label: "Operational status", type: "select", options: opts(SCHOOL_STATUS), defaultValue: "Active", required: true },
  { name: "accredited", label: "Accredited", type: "switch", help: "Meets ministry accreditation standards" },
  { name: "notes", label: "Inspection notes", type: "textarea", span: 2 },
];

const columns: Column<SchoolRow>[] = [
  { key: "code", header: "Code" },
  { key: "name", header: "School" },
  { key: "level", header: "Level" },
  { key: "ownership", header: "Ownership" },
  { key: "state", header: "State" },
  { key: "county", header: "County" },
  { key: "capacity", header: "Capacity", render: (r) => Number(r.capacity ?? 0).toLocaleString() },
  {
    key: "accredited",
    header: "Accredited",
    render: (r) => (
      <Badge variant={r.accredited ? "default" : "outline"}>{r.accredited ? "Yes" : "Pending"}</Badge>
    ),
    exportValue: (r) => (r.accredited ? "Yes" : "Pending"),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={r.status === "Active" ? "secondary" : "outline"}>{r.status}</Badge>,
  },
];

function SchoolsPage() {
  return (
    <AppShell
      title="School Management System (SMS)"
      subtitle="National register of schools, accreditation and licensing"
    >
      <RecordManager<SchoolRow>
        table="schools"
        singular="School"
        fields={fields}
        columns={columns}
        searchKeys={["code", "name", "state", "county", "payam", "head_teacher"]}
        emptyHint="No schools registered yet. Register the first school to begin building the national register."
      />
    </AppShell>
  );
}
