import { useEffect, useState } from "react";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "officer" | "viewer";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading, user: session?.user ?? null };
}

/** Roles of the signed-in officer. Cached so every component shares one request. */
export function useRoles() {
  const { user } = useSession();
  const userId = user?.id;

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["my-roles", userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  return {
    roles,
    loading: Boolean(userId) && isLoading,
    isAdmin: roles.includes("admin"),
    canWrite: roles.includes("admin") || roles.includes("officer"),
  };
}

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  job_title: string | null;
  duty_station: string | null;
  created_at: string;
};

/** The signed-in officer's profile row (name, job title, duty station). */
export function useMyProfile() {
  const { user } = useSession();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["profiles", "me", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_title, duty_station, created_at")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  return { ...query, user };
}

/** Ends the session and drops every cached query so the next officer starts clean. */
export async function signOut(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  await supabase.auth.signOut();
  queryClient.clear();
}
