import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useSchoolLookup } from "@/hooks/useLookups";
import { RecordManager, type Column, type Field } from "@/components/RecordManager";
import { Badge } from "@/components/ui/badge";
import {
  EMPLOYMENT_STATUS,
  GENDERS,
  QUALIFICATIONS,
  SUBJECTS,
  TEACHER_STATUS,
} from "@/lib/moges";

export const Route = createFileRoute("/_authenticated/teachers")({
  head: () => ({
    meta: [
      { title: "Teacher Management System — MoGEI South Sudan" },
      {
        name: "description",
        content:
          "Registration, deployment, licensing and payroll details for every teacher in the national teaching service.",
      },
      { property: "og:title", content: "Teacher Management System — MoGEI" },
      { property: "og:description", content: "National teacher register, deployment and licensing." },
    ],
  }),
  component: TeachersPage,
});

type TeacherRow = {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  gender: string;
  qualification: string;
  main_subject: string | null;
  employment_status: string;
  school_id: string | null;
  monthly_salary: number;
  status: string;
};

const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }));

function TeachersPage() {
  const { options: schoolOptions, nameOf: schoolName } = useSchoolLookup();

  const fields: Field[] = [
    { name: "code", label: "Payroll / teacher code", required: true },
    { name: "national_id", label: "National ID" },
    { name: "first_name", label: "First name", required: true },
    { name: "last_name", label: "Last name", required: true },
    { name: "gender", label: "Gender", type: "select", options: opts(GENDERS), defaultValue: "Male", required: true },
    { name: "date_of_birth", label: "Date of birth", type: "date" },
    { name: "phone", label: "Phone" },
    { name: "email", label: "Email", type: "email" },
    { name: "qualification", label: "Highest qualification", type: "select", options: opts(QUALIFICATIONS), defaultValue: "Certificate", required: true },
    { name: "main_subject", label: "Main subject", type: "select", options: opts(SUBJECTS) },
    { name: "employment_status", label: "Employment status", type: "select", options: opts(EMPLOYMENT_STATUS), defaultValue: "Permanent", required: true },
    { name: "grade_level", label: "Salary grade" },
    { name: "monthly_salary", label: "Monthly salary (SSP)", type: "number", defaultValue: 0, min: 0 },
    { name: "licence_number", label: "Teaching licence number" },
    { name: "licence_expiry", label: "Licence expiry", type: "date" },
    { name: "school_id", label: "Posted school", type: "select", options: schoolOptions, span: 2 },
    { name: "hire_date", label: "Date of first appointment", type: "date" },
    { name: "status", label: "Service status", type: "select", options: opts(TEACHER_STATUS), defaultValue: "Active", required: true },
  ];

  const columns: Column<TeacherRow>[] = [
    { key: "code", header: "Code" },
    { key: "name", header: "Teacher", render: (r) => `${r.first_name} ${r.last_name}` },
    { key: "gender", header: "Gender" },
    { key: "qualification", header: "Qualification" },
    { key: "main_subject", header: "Subject" },
    { key: "employment_status", header: "Employment" },
    { key: "school_id", header: "Posted school", render: (r) => schoolName(r.school_id, "Unposted") },
    {
      key: "monthly_salary",
      header: "Salary (SSP)",
      render: (r) => Number(r.monthly_salary ?? 0).toLocaleString(),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={r.status === "Active" ? "secondary" : "outline"}>{r.status}</Badge>,
    },
  ];

  return (
    <AppShell
      title="Teacher Management System (TMS)"
      subtitle="Registration, deployment, licensing and payroll linkage"
    >
      <RecordManager<TeacherRow>
        table="teachers"
        singular="Teacher"
        fields={fields}
        columns={columns}
        searchKeys={["code", "first_name", "last_name", "main_subject", "licence_number"]}
        emptyHint="No teachers on the register yet."
      />
    </AppShell>
  );
}
