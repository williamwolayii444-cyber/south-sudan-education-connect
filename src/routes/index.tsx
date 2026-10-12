import { createFileRoute, Link } from "@tanstack/react-router";
import { School, GraduationCap, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlagMark, ThemeToggle } from "@/components/AppShell";
import { useSession } from "@/hooks/useSession";
import { MODULES } from "@/lib/moges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MoGEI Integrated Management System — South Sudan" },
      {
        name: "description",
        content:
          "Official national education platform of the Ministry of General Education and Instruction, Republic of South Sudan: school, teacher and learner registries.",
      },
      { property: "og:title", content: "MoGEI Integrated Management System — South Sudan" },
      {
        property: "og:description",
        content:
          "National registries for schools, teachers and learners across the Republic of South Sudan.",
      },
    ],
  }),
  component: Home,
});

const GROUP_ORDER = [
  "Core registries",
  "Service delivery",
  "Corporate services",
  "Analytics",
  "Citizen services",
  "Technical",
];

function Home() {
  const { user } = useSession();
  const groups = GROUP_ORDER.map((g) => ({
    group: g,
    modules: MODULES.filter((m) => m.group === g),
  })).filter((g) => g.modules.length);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <FlagMark className="h-7 w-10" />
            <div>
              <p className="font-display text-xs uppercase tracking-wider text-sidebar-primary">
                Republic of South Sudan
              </p>
              <p className="font-display text-lg leading-tight">
                Ministry of General Education &amp; Instruction
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
            <Button asChild variant="secondary">
              <Link to={user ? "/dashboard" : "/auth"}>{user ? "Open dashboard" : "Officer sign in"}</Link>
            </Button>
          </div>
        </div>
        <div className="flag-rule" />
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-nile">
          National Education Digital Transformation Platform
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-5xl">
          One integrated record of every school, teacher and learner in South Sudan.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          The Integrated Management System consolidates the Ministry&apos;s registries, statistics
          and service delivery modules into a single authoritative platform for national, state and
          county education officers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to={user ? "/dashboard" : "/auth"}>
              {user ? "Go to the national dashboard" : "Access the system"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#modules">Explore the {MODULES.length} modules</a>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: GraduationCap,
              title: "Student Information",
              body: "Registration, enrolment, transfers, promotion and graduation.",
            },
            {
              icon: Users,
              title: "Teacher Management",
              body: "Deployment, licensing, qualification and payroll linkage.",
            },
            {
              icon: School,
              title: "School Management",
              body: "Registration, accreditation, capacity and geo-location.",
            },
            {
              icon: ShieldCheck,
              title: "Identity & Access",
              body: "Role-based control for ministry, state and county officers.",
            },
          ].map((c) => (
            <div key={c.title} className="gov-panel rounded-md p-5">
              <span className="inline-flex size-9 items-center justify-center rounded-md bg-nile/10 text-nile">
                <c.icon className="size-5" />
              </span>
              <h2 className="mt-3 font-display text-base">{c.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="modules" className="scroll-mt-4 border-t bg-card">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-2xl">Platform subsystems</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {MODULES.length} modules covering strategic, operational, technical and citizen-facing
            services.
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <div key={g.group}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {g.group}
                </h3>
                <ul className="mt-3 space-y-2">
                  {g.modules.map((m) => (
                    <li key={m.code} className="flex gap-3 rounded-md border bg-background/60 p-3">
                      <span className="w-10 shrink-0 font-display text-xs font-semibold text-nile">
                        {m.code}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{m.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {m.description}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        Ministry of General Education and Instruction · Juba, Republic of South Sudan
      </footer>
    </div>
  );
}
