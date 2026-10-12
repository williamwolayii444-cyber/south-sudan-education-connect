# South Sudan Education Connect

Turn all modules into a fully working system, not just an implementation roadmap       For a South Sudan Ministry of General Education and Instruction Integrated Management System, the concepts should be organized into strategic, operational, technical, and citizen-service components.

Core Education Management Concepts

Student Information Management

Student registration

Student enrollment

Student transfers

Student attendance

Student discipline records

Student promotion

Student graduation

Student health records

Student digital ID

Teacher Management

Teacher registration

Teacher deployment

Teacher transfers

Teacher promotion

Teacher appraisal

Teacher licensing

Teacher attendance

Teacher professional development

Teacher payroll integration

School Management

School registration

School accreditation

School licensing

School inspection

School perform…

[13:12, 30/07/2026] William Wol Ayii: A complete ministry platform should include:

Student Information System (SIS)

Teacher Management System (TMS)

School Management System (SMS)

Examination Management System (EMS)

Education Management Information System (EMIS)

Human Resource Management System (HRMS)

Payroll Management System

Financial Management System (FMS)

Document Management System (DMS)

Inspection & Quality Assurance System

Curriculum Management System

GIS & Mapping System

E-Learning Platform

Parent & Citizen Portal

AI Analytics & Decision Support System

Mobile Applications

National Education Dashboard

Partners of General Education & Instruction

Security & Identity Management System

Data Warehouse & Business Intelligence Platform

Together, these form a full National Education Digital Transformation Platform for the Ministry of General Education and Instruction in South Sudan

## Development

The app is a client-side React SPA (Vite + TanStack Router + React Query) backed by Supabase
(Postgres, Auth and Row Level Security). You need Node.js 20+ and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev        # http://localhost:5173
```

### Environment

Create a `.env` file in the project root (never commit it):

```sh
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable / anon key>
# Optional: show "Continue with Google" once Google is enabled in Supabase → Auth → Providers
# VITE_ENABLE_GOOGLE_AUTH=true
```

Only `VITE_*` variables reach the browser. Do not put the service-role key in any `VITE_*`
variable, and set the same two variables in your hosting dashboard (e.g. Vercel → Settings →
Environment Variables).

### Database

Schema changes live in `supabase/migrations`. Apply them to your project in order, either with
the Supabase CLI (`supabase link --project-ref <ref>` then `supabase db push`) or by pasting each
file into the SQL editor.

In Supabase → Authentication → URL Configuration, add `https://<your-domain>/**` (and
`http://localhost:5173/**` for development) to the redirect URLs so email confirmation, password
reset and Google sign-in can return to the app.

### Access levels

| Role    | Can do                                                        |
| ------- | ------------------------------------------------------------- |
| admin   | Everything, plus manage officer access and view the audit trail |
| officer | Create, amend and remove records in every register            |
| viewer  | Read-only (default for newly registered accounts)             |

The first account ever created becomes an administrator.
made some changes 