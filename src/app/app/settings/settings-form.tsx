"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Settings = { offer: string; icp: string; tone: string; sample_msg: string };

const FIELDS: { key: keyof Settings; label: string; placeholder: string; rows: number }[] = [
  { key: "offer", label: "What do you sell?", rows: 3,
    placeholder: "Done-for-you LinkedIn outreach that books 10–15 sales calls a month for B2B SaaS startups." },
  { key: "icp", label: "Who do you sell to?", rows: 2,
    placeholder: "Founders and heads of sales at seed–Series A SaaS companies in the US." },
  { key: "tone", label: "Tone", rows: 1,
    placeholder: "Friendly, direct, no buzzwords" },
  { key: "sample_msg", label: "A message you like (optional)", rows: 3,
    placeholder: "Hi Sam, saw you just launched the analytics add-on – congrats. ..." },
];

export default function SettingsForm({ userId, initial }: { userId: string; initial: Settings }) {
  const [values, setValues] = useState<Settings>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const { error } = await createClient()
      .from("profiles")
      .update(values)              // RLS + column grants: only these 4 columns are allowed
      .eq("id", userId);
    if (error) { setError(error.message); setStatus("error"); }
    else setStatus("saved");
  }

  return (
    <form onSubmit={save} className="mt-6 space-y-5">
      {FIELDS.map((f) => (
        <label key={f.key} className="block">
          <span className="text-sm font-medium">{f.label}</span>
          <textarea
            rows={f.rows}
            value={values[f.key]}
            placeholder={f.placeholder}
            onChange={(e) => { setValues({ ...values, [f.key]: e.target.value }); setStatus("idle"); }}
            className="mt-1 w-full rounded border p-2 text-sm"
          />
        </label>
      ))}
      <button disabled={status === "saving"} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
        {status === "saving" ? "Saving…" : "Save"}
      </button>
      {status === "saved" && <span className="ml-3 text-sm text-green-700">Saved ✓</span>}
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}