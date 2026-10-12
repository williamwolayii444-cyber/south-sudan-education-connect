import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { FlagMark, ThemeToggle } from "@/components/AppShell";
import { MIN_PASSWORD_LENGTH } from "@/components/UserProfile";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthSearch = { mode?: "recovery" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch =>
    search.mode === "recovery" ? { mode: "recovery" } : {},
  head: () => ({
    meta: [
      { title: "Officer Sign In — MoGEI Integrated Management System" },
      {
        name: "description",
        content:
          "Secure sign in for Ministry of General Education and Instruction officers to the national education management system.",
      },
      { property: "og:title", content: "Officer Sign In — MoGEI South Sudan" },
      {
        property: "og:description",
        content: "Restricted access for authorised ministry, state and county education officers.",
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid official email address").max(255);
const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(72);
const credentials = z.object({ email: emailSchema, password: passwordSchema });
// Google sign-in must first be enabled under Supabase → Authentication → Providers.
const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_AUTH === "true";

function AuthPage() {
  const { mode } = Route.useSearch();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-sidebar px-6 py-5 text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <FlagMark className="h-7 w-10" />
            <div>
              <p className="font-display text-xs uppercase tracking-wider text-sidebar-primary">
                Republic of South Sudan
              </p>
              <p className="font-display text-lg leading-tight">
                Ministry of General Education &amp; Instruction
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-sidebar-border/60 bg-sidebar-accent/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-sidebar-foreground/80 sm:inline">
              Secure access portal
            </span>
            <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          </div>
        </div>
      </header>
      <div className="flag-rule" />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="gov-panel w-full max-w-md rounded-md p-6 sm:p-8">
          {mode === "recovery" ? <RecoveryForm /> : <SignInForms />}
        </div>
      </main>

      <footer className="px-6 py-5 text-center text-xs text-muted-foreground">
        Access is logged and restricted to authorised officers.
      </footer>
    </div>
  );
}

function SignInForms() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (fullName.trim().length < 2) return toast.error("Enter your full official name");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      // Email confirmation is disabled on this project — the officer is already signed in.
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    toast.success("Account requested. Check your inbox to confirm, then sign in.");
    setTab("signin");
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/auth?mode=recovery`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("If that address has an account, a reset link is on its way.");
    setTab("signin");
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error("Google sign-in is unavailable. Use your email and password.");
  }

  return (
    <>
      <h1 className="font-display text-xl">Integrated Management System</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Restricted to authorised education officers.
      </p>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign in</TabsTrigger>
          <TabsTrigger value="signup">Request access</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={signIn} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="email">Official email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setTab("reset")}
                  className="text-xs text-nile underline-offset-2 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Verifying…" : "Sign in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={signUp} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="name">Full official name</Label>
              <Input
                id="name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email2">Official email</Label>
              <Input
                id="email2"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password2">Password</Label>
              <Input
                id="password2"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                At least {MIN_PASSWORD_LENGTH} characters.
              </p>
            </div>
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              New accounts start with read-only access. An administrator grants officer rights
              after verifying your appointment.
            </p>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Submitting…" : "Request access"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="reset">
          <form onSubmit={resetPassword} className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Enter your official email and we&apos;ll send a link to set a new password.
            </p>
            <div>
              <Label htmlFor="email3">Official email</Label>
              <Input
                id="email3"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setTab("signin")}>
              Back to sign in
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {GOOGLE_AUTH_ENABLED && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            Continue with Google
          </Button>
        </>
      )}
    </>
  );
}

/** Shown when an officer arrives from a password-reset email. */
function RecoveryForm() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirm) return toast.error("The two passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Welcome back.");
    navigate({ to: "/dashboard", replace: true });
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Verifying your reset link…</p>;
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-xl">Reset link expired</h1>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or has already been used. Request a new one from the
          sign-in page.
        </p>
        <Button asChild className="w-full">
          <Link to="/auth">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="font-display text-xl">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          For {session.user.email}. Use at least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>
      <div>
        <Label htmlFor="recovery-password">New password</Label>
        <Input
          id="recovery-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="recovery-confirm">Confirm new password</Label>
        <Input
          id="recovery-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
