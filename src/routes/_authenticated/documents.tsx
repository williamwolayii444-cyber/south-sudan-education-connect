import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RecordManager, today, type Column, type Field } from "@/components/RecordManager";
import { Badge } from "@/components/ui/badge";
import { DIRECTORATES, DOCUMENT_CATEGORIES, DOCUMENT_STATUS } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Document Management — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Repository of ministry circulars, policies, ministerial orders and official correspondence.",
      },
      { property: "og:title", content: "Document Management — MoGEI" },
      { property: "og:description", content: "Circulars, policies and official correspondence." },
    ],
  }),
  component: DocumentsPage,
});

type DocRow = {
  id: string;
  reference: string;
  title: string;
  category: string;
  directorate: string | null;
  issued_on: string;
  link: string | null;
  status: string;
};

const opts = (l: string[]) => l.map((v) => ({ value: v, label: v }));

const fields: Field[] = [
  { name: "reference", label: "Reference number", required: true, placeholder: "e.g. MoGEI/CIR/2026/012" },
  { name: "category", label: "Category", type: "select", options: opts(DOCUMENT_CATEGORIES), defaultValue: "Circular", required: true },
  { name: "title", label: "Title", required: true, span: 2 },
  { name: "directorate", label: "Issuing directorate", type: "select", options: opts(DIRECTORATES), span: 2 },
  { name: "issued_on", label: "Date issued", type: "date", defaultValue: today(), required: true },
  { name: "status", label: "Status", type: "select", options: opts(DOCUMENT_STATUS), defaultValue: "Active", required: true },
  { name: "link", label: "Document link", span: 2, placeholder: "https://…", help: "Must start with https:// or http://" },
  { name: "summary", label: "Summary", type: "textarea", span: 2 },
];

const columns: Column<DocRow>[] = [
  { key: "reference", header: "Reference" },
  { key: "title", header: "Title" },
  { key: "category", header: "Category" },
  { key: "directorate", header: "Directorate" },
  { key: "issued_on", header: "Issued" },
  {
    key: "link",
    header: "Link",
    render: (r) =>
      r.link && /^https?:\/\//i.test(r.link) ? (
        <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-nile underline underline-offset-2">
          Open
        </a>
      ) : (
        "—"
      ),
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={r.status === "Active" ? "default" : "secondary"}>{r.status}</Badge>,
  },
];

function DocumentsPage() {
  return (
    <AppShell
      title="Document Management System (DMS)"
      subtitle="Circulars, policies and official correspondence repository"
    >
      <RecordManager<DocRow>
        table="documents"
        singular="Document"
        fields={fields}
        columns={columns}
        searchKeys={["reference", "title", "category", "directorate", "summary"]}
        emptyHint="No documents filed in the repository yet."
      />
    </AppShell>
  );
}
