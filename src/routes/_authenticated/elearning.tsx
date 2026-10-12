import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RecordManager, type Column, type Field } from "@/components/RecordManager";
import { Badge } from "@/components/ui/badge";
import { CLASS_LEVELS, LESSON_LANGUAGES, LESSON_MEDIA, LESSON_STATUS, SUBJECTS } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/elearning")({
  head: () => ({
    meta: [
      { title: "E-Learning & Radio Education — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Registry of radio, video and offline lessons delivered to learners across South Sudan.",
      },
      { property: "og:title", content: "E-Learning & Radio Education — MoGEI" },
      { property: "og:description", content: "Radio, video and offline lesson registry." },
    ],
  }),
  component: ElearningPage,
});

type LessonRow = {
  id: string;
  code: string;
  title: string;
  medium: string;
  subject: string | null;
  class_level: string | null;
  language: string;
  duration_minutes: number;
  broadcast_date: string | null;
  status: string;
};

const opts = (l: string[]) => l.map((v) => ({ value: v, label: v }));

const fields: Field[] = [
  { name: "code", label: "Lesson code", required: true },
  { name: "medium", label: "Media", type: "select", options: opts(LESSON_MEDIA), defaultValue: "Radio", required: true },
  { name: "title", label: "Lesson title", required: true, span: 2 },
  { name: "subject", label: "Subject", type: "select", options: opts(SUBJECTS), defaultValue: "English", required: true },
  { name: "class_level", label: "Class level", type: "select", options: opts(CLASS_LEVELS), defaultValue: "P1", required: true },
  { name: "language", label: "Language", type: "select", options: opts(LESSON_LANGUAGES), defaultValue: "English", required: true },
  { name: "duration_minutes", label: "Duration (minutes)", type: "number", defaultValue: 30, min: 1, max: 600 },
  { name: "broadcast_date", label: "Broadcast / release date", type: "date" },
  { name: "status", label: "Status", type: "select", options: opts(LESSON_STATUS), defaultValue: "Published", required: true },
  { name: "link", label: "Resource link", span: 2, placeholder: "https://…" },
  { name: "description", label: "Description", type: "textarea", span: 2 },
];

const columns: Column<LessonRow>[] = [
  { key: "code", header: "Code" },
  { key: "title", header: "Lesson" },
  { key: "medium", header: "Media" },
  { key: "subject", header: "Subject" },
  { key: "class_level", header: "Class" },
  { key: "language", header: "Language" },
  { key: "duration_minutes", header: "Minutes" },
  { key: "broadcast_date", header: "Broadcast" },
  { key: "status", header: "Status", render: (r) => <Badge variant="secondary">{r.status}</Badge> },
];

function ElearningPage() {
  return (
    <AppShell
      title="E-Learning & Radio Education Platform (ELP)"
      subtitle="Radio, video and offline lesson delivery registry"
    >
      <RecordManager<LessonRow>
        table="lessons"
        singular="Lesson"
        fields={fields}
        columns={columns}
        searchKeys={["code", "title", "subject", "language", "medium", "description"]}
        emptyHint="No lessons published to the platform yet."
      />
    </AppShell>
  );
}
