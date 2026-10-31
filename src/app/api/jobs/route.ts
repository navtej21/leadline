import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Body = z.object({
  filename: z.string().max(200),
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(2000),
  mapping: z.object({
    first_name: z.string().min(1),
    company: z.string().min(1),
    website: z.string().min(1),
    title: z.string().optional().default(""),
  }),
});

// "https://www.BrightCart.com/about" -> "brightcart.com"
function normalizeDomain(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return host.includes(".") ? host : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  const { filename, rows, mapping } = parsed.data;

  const get = (row: Record<string, unknown>, col: string) =>
    col ? String(row[col] ?? "").trim().slice(0, 200) : "";

  const leads = rows.map((row) => {
    const website = normalizeDomain(get(row, mapping.website));
    return {
      user_id: user.id,
      raw: row,
      first_name: get(row, mapping.first_name),
      company: get(row, mapping.company),
      title: get(row, mapping.title),
      website,
      status: website ? "pending" : "failed",
      error: website ? null : "Missing or invalid website",
    };
  });

  const valid = leads.filter((l) => l.status === "pending").length;
  if (valid === 0)
    return NextResponse.json({ error: "No rows have a valid website." }, { status: 400 });

  // pre-check only — real charging happens per lead in Step 8
  const { data: profile } = await supabase
    .from("profiles").select("credits").eq("id", user.id).single();
  if (!profile || profile.credits < valid)
    return NextResponse.json(
      { error: `You need ${valid} credits but have ${profile?.credits ?? 0}.` },
      { status: 402 }
    );

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({ user_id: user.id, filename, total: leads.length, failed: leads.length - valid })
    .select("id")
    .single();
  if (jobError || !job)
    return NextResponse.json({ error: "Could not create job" }, { status: 500 });

  // insert in chunks so big files don't hit request limits
  for (let i = 0; i < leads.length; i += 500) {
    const chunk = leads.slice(i, i + 500).map((l) => ({ ...l, job_id: job.id }));
    const { error } = await supabase.from("leads").insert(chunk);
    if (error) {
      await supabase.from("jobs").delete().eq("id", job.id); // cascade removes inserted leads
      return NextResponse.json({ error: "Could not save leads" }, { status: 500 });
    }
  }

  return NextResponse.json({ jobId: job.id, valid, failed: leads.length - valid });
}