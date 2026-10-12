import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RecordManager, today, type Column, type Field } from "@/components/RecordManager";
import { useSchoolLookup } from "@/hooks/useLookups";
import { Badge } from "@/components/ui/badge";
import { CLASS_LEVELS, DISABILITIES, GENDERS, STATES, STUDENT_STATUS } from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({
    meta: [
      { title: "Student Information System — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Learner registration, enrolment, transfers, promotion and graduation records for schools across South Sudan.",
      },
      { property: "og:title", content: "Student Information System — MoGEI" },
      { property: "og:description", content: "National learner register and enrolment records." },
    ],
  }),
  component: StudentsPage,
});

type StudentRow = {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  gender: string;
  class_level: string;
  school_id: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  county_of_origin: string | null;
  disability: string;
  status: string;
};

const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }));

function StudentsPage() {
  const { options: schoolOptions, nameOf: schoolName } = useSchoolLookup();

  const fields: Field[] = [
    { name: "code", label: "Learner code", required: true, placeholder: "e.g. SSD-2026-000145" },
    { name: "class_level", label: "Class level", type: "select", options: opts(CLASS_LEVELS), defaultValue: "P1", required: true },
    { name: "first_name", label: "First name", required: true },
    { name: "last_name", label: "Last name", required: true },
    { name: "gender", label: "Gender", type: "select", options: opts(GENDERS), defaultValue: "Male", required: true },
    { name: "date_of_birth", label: "Date of birth", type: "date" },
    { name: "school_id", label: "School", type: "select", options: schoolOptions, span: 2 },
    { name: "guardian_name", label: "Parent / guardian" },
    { name: "guardian_phone", label: "Guardian phone" },
    { name: "county_of_origin", label: "State / county of origin", type: "select", options: opts(STATES) },
    { name: "disability", label: "Special needs", type: "select", options: opts(DISABILITIES), defaultValue: "None" },
    { name: "enrollment_date", label: "Enrolment date", type: "date", defaultValue: today(), required: true },
    { name: "status", label: "Enrolment status", type: "select", options: opts(STUDENT_STATUS), defaultValue: "Enrolled", required: true },
    { name: "notes", label: "Remarks (discipline, health, transfers)", type: "textarea", span: 2 },
  ];

  const columns: Column<StudentRow>[] = [
    { key: "code", header: "Learner code" },
    { key: "name", header: "Name", render: (r) => `${r.first_name} ${r.last_name}` },
    { key: "gender", header: "Gender" },
    { key: "class_level", header: "Class" },
    { key: "school_id", header: "School", render: (r) => schoolName(r.school_id, "Unassigned") },
    { key: "county_of_origin", header: "Origin" },
    { key: "guardian_name", header: "Guardian" },
    { key: "guardian_phone", header: "Guardian phone" },
    { key: "disability", header: "Special needs" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "Enrolled" ? "secondary" : "outline"}>{r.status}</Badge>
      ),
    },
  ];

  return (
    <AppShell
      title="Student Information System (SIS)"
      subtitle="Learner registration, enrolment, transfers and promotion"
    >
      <RecordManager<StudentRow>
        table="students"
        singular="Student"
        fields={fields}
        columns={columns}
        searchKeys={["code", "first_name", "last_name", "guardian_name", "class_level", "county_of_origin"]}
        emptyHint="No learners registered yet."
      />
    </AppShell>
  );
}
