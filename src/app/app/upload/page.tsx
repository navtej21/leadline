"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";

type Row = Record<string, string>;
type FieldKey = "first_name" | "company" | "website" | "title";

const FIELDS: { key: FieldKey; label: string; required: boolean; guesses: string[] }[] = [
  { key: "first_name", label: "First name", required: true,
    guesses: ["first name", "firstname", "first_name", "name"] },
  { key: "company", label: "Company", required: true,
    guesses: ["company", "company name", "organization", "organisation"] },
  { key: "website", label: "Website", required: true,
    guesses: ["website", "company website", "url", "domain", "company url", "company domain"] },
  { key: "title", label: "Job title (optional)", required: false,
    guesses: ["title", "job title", "position", "headline", "role"] },
];

const MAX_ROWS = 2000;

function guessColumn(headers: string[], guesses: string[]) {
  return headers.find((h) => guesses.includes(h.trim().toLowerCase())) ?? "";
}

export default function UploadPage() {
  const router = useRouter();
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({
    first_name: "", company: "", website: "", title: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const hs = result.meta.fields ?? [];
        if (result.data.length === 0) return setError("This file has no rows.");
        if (result.data.length > MAX_ROWS)
          return setError(`Max ${MAX_ROWS} rows per upload. This file has ${result.data.length}.`);
        setFilename(file.name);
        setHeaders(hs);
        setRows(result.data);
        // auto-guess the mapping from header names
        setMapping({
          first_name: guessColumn(hs, FIELDS[0].guesses),
          company: guessColumn(hs, FIELDS[1].guesses),
          website: guessColumn(hs, FIELDS[2].guesses),
          title: guessColumn(hs, FIELDS[3].guesses),
        });
      },
      error: (err) => setError(err.message),
    });
  }

  async function handleSubmit() {
    const missing = FIELDS.filter((f) => f.required && !mapping[f.key]);
    if (missing.length) return setError(`Please map: ${missing.map((f) => f.label).join(", ")}`);

    setLoading(true);
    setError("");
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, rows, mapping }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Upload failed");

    router.push("/app");
    router.refresh();
  }

  const preview = rows.slice(0, 5);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/app" className="text-sm text-gray-600 underline">← Dashboard</Link>
      <h1 className="mt-4 text-2xl font-bold">Upload leads</h1>
      <p className="mt-1 text-sm text-gray-600">CSV with at least first name, company and website. Max {MAX_ROWS} rows.</p>

      <input type="file" accept=".csv" onChange={handleFile} className="mt-6 block" />

      {rows.length > 0 && (
        <>
          <h2 className="mt-8 font-semibold">Map your columns</h2>
          <div className="mt-3 grid grid-cols-2 gap-4">
            {FIELDS.map((f) => (
              <label key={f.key} className="text-sm">
                {f.label}
                <select
                  value={mapping[f.key]}
                  onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
                  className="mt-1 block w-full rounded border p-2"
                >
                  <option value="">— not mapped —</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
            ))}
          </div>

          <h2 className="mt-8 font-semibold">Preview (first 5 of {rows.length})</h2>
          <table className="mt-3 w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>{FIELDS.map((f) => <th key={f.key} className="border p-2 text-left">{f.label}</th>)}</tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  {FIELDS.map((f) => (
                    <td key={f.key} className="border p-2">{mapping[f.key] ? row[mapping[f.key]] : "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleSubmit} disabled={loading}
            className="mt-6 rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Uploading…" : `Create job (${rows.length} leads)`}
          </button>
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}