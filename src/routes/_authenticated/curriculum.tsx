import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RecordManager, type Column, type Field } from "@/components/RecordManager";
import { Badge } from "@/components/ui/badge";
import { CLASS_LEVELS, CURRICULUM_STATUS, CURRICULUM_TYPES, SUBJECTS } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum Management — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "National syllabi, textbooks, teacher guides and learning material distribution tracking.",
      },
      { property: "og:title", content: "Curriculum Management — MoGEI" },
      { property: "og:description", content: "Syllabi, textbooks and distribution tracking." },
    ],
  }),
  component: CurriculumPage,
});

type CurrRow = {
  id: string;
  code: string;
  title: string;
  item_type: string;
  subject: string | null;
  class_level: string | null;
  edition_year: number | null;
  copies_printed: number;
  copies_distributed: number;
  status: string;
};

const opts = (l: string[]) => l.map((v) => ({ value: v, label: v }));

const fields: Field[] = [
  { name: "code", label: "Item code", required: true },
  { name: "item_type", label: "Item type", type: "select", options: opts(CURRICULUM_TYPES), defaultValue: "Syllabus", required: true },
  { name: "title", label: "Title", required: true, span: 2 },
  { name: "subject", label: "Subject", type: "select", options: opts(SUBJECTS), defaultValue: "English", required: true },
  { name: "class_level", label: "Class level", type: "select", options: opts(CLASS_LEVELS), defaultValue: "P1", required: true },
  { name: "edition_year", label: "Edition year", type: "number", defaultValue: new Date().getFullYear(), min: 1950, max: 2100 },
  { name: "publisher", label: "Publisher" },
  { name: "status", label: "Status", type: "select", options: opts(CURRICULUM_STATUS), defaultValue: "Approved", required: true },
  { name: "copies_printed", label: "Copies printed", type: "number", defaultValue: 0, min: 0 },
  { name: "copies_distributed", label: "Copies distributed", type: "number", defaultValue: 0, min: 0 },
  { name: "notes", label: "Notes", type: "textarea", span: 2 },
];

const columns: Column<CurrRow>[] = [
  { key: "code", header: "Code" },
  { key: "title", header: "Title" },
  { key: "item_type", header: "Type" },
  { key: "subject", header: "Subject" },
  { key: "class_level", header: "Class" },
  { key: "edition_year", header: "Edition" },
  { key: "copies_printed", header: "Printed", render: (r) => Number(r.copies_printed ?? 0).toLocaleString() },
  {
    key: "copies_distributed",
    header: "Distributed",
    render: (r) => {
      const printed = Number(r.copies_printed ?? 0);
      const dist = Number(r.copies_distributed ?? 0);
      return `${dist.toLocaleString()}${printed ? ` (${Math.round((dist / printed) * 100)}%)` : ""}`;
    },
  },
  { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
];

function CurriculumPage() {
  return (
    <AppShell
      title="Curriculum Management System (CMS)"
      subtitle="National syllabi, textbooks and learning material distribution"
    >
      <RecordManager<CurrRow>
        table="curriculum_items"
        singular="Curriculum item"
        fields={fields}
        columns={columns}
        searchKeys={["code", "title", "item_type", "subject", "class_level", "publisher"]}
        emptyHint="No curriculum items registered yet."
      />
    </AppShell>
  );
}
