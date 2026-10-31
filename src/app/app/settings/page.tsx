import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./settings-form";


export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("offer, icp, tone, sample_msg")
    .eq("id", user!.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/app" className="text-sm text-gray-600 underline">← Dashboard</Link>
      <h1 className="mt-4 text-2xl font-bold">Your offer</h1>
      <p className="mt-1 text-sm text-gray-600">
        Claude uses this to write messages that sound like you.
      </p>
      <SettingsForm
        userId={user!.id}
        initial={{
          offer: profile?.offer ?? "",
          icp: profile?.icp ?? "",
          tone: profile?.tone ?? "",
          sample_msg: profile?.sample_msg ?? "",
        }}
      />
    </main>
  );
}