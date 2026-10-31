import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout/logout-button";

import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("email, credits").eq("id", user!.id).single();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, filename, status, total, done, failed, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <LogoutButton />
      </div>
      <p className="mt-2 text-sm">{profile?.email} · Credits: <b>{profile?.credits}</b></p>

      <div className="mt-6 flex gap-3">
        <Link href="/app/upload" className="rounded bg-black px-4 py-2 text-white">Upload CSV</Link>
        <Link href="/app/settings" className="rounded border px-4 py-2">Your offer</Link>
      </div>

      <h2 className="mt-10 font-semibold">Your jobs</h2>
      {!jobs?.length ? (
        <p className="mt-2 text-sm text-gray-600">No uploads yet.</p>
      ) : (
        <table className="mt-3 w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-2 text-left">File</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Progress</th>
              <th className="border p-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td className="border p-2">{j.filename}</td>
                <td className="border p-2">{j.status}</td>
                <td className="border p-2">{j.done + j.failed} / {j.total} ({j.failed} failed)</td>
                <td className="border p-2">{new Date(j.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}