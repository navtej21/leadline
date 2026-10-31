import { createClient } from "@/lib/supabase/server";
import LogoutButton from "../logout/logout-button";

import { Suspense } from "react";
import { connection } from "next/server";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await connection(); // "render this per request, never prerender"

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, credits")
    .eq("id", user!.id)
    .single();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">Logged in as {profile?.email}</p>
      <p className="mt-1">Credits: <b>{profile?.credits}</b></p>
      <div className="mt-4"><LogoutButton /></div>
    </main>
  );
}