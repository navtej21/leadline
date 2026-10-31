import "server-only";
import * as cheerio from "cheerio";
import { admin } from "@/lib/supabase/admin";

const MAX_CHARS = 3000;   // cap text sent to Claude = cheap calls
const MIN_CHARS = 50;     // less than this = not enough to personalise
const CACHE_DAYS = 30;    // re-fetch a site after 30 days

/* ------------------------------------------------------------------ */
/* 1. Safety: only fetch normal public company domains (prevents SSRF) */
/* ------------------------------------------------------------------ */
export function isSafeDomain(domain: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return false;          // raw IPs
  if (
    domain === "localhost" ||
    domain.endsWith(".local") ||
    domain.endsWith(".internal")
  ) {
    return false;                                                     // internal hosts
  }
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain);                    // looks like a real domain
}

/* ------------------------------------------------------------------ */
/* 2. Turn raw HTML into short, clean text for Claude                 */
/* ------------------------------------------------------------------ */
export function extractText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, nav, footer, form").remove();

  const clean = (s: string) => s.replace(/\s+/g, " ").trim();

  const title = clean($("title").first().text());
  const description = clean(
    $('meta[name="description"]').attr("content") ??
      $('meta[property="og:description"]').attr("content") ??
      ""
  );
  const headings = $("h1, h2")
    .map((_, el) => clean($(el).text()))
    .get()
    .filter(Boolean)
    .slice(0, 10);
  const paragraphs = $("p")
    .map((_, el) => clean($(el).text()))
    .get()
    .filter((t) => t.length > 40)
    .slice(0, 15);

  const parts: string[] = [];
  if (title) parts.push(`Title: ${title}`);
  if (description) parts.push(`Description: ${description}`);
  if (headings.length) parts.push(`Headings: ${headings.join(" | ")}`);
  if (paragraphs.length) parts.push(`Text: ${paragraphs.join(" ")}`);
  return parts.join("\n");
}

/* ------------------------------------------------------------------ */
/* 3. Download a page safely (timeout, errors → null)                 */
/* ------------------------------------------------------------------ */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LeadlineBot/1.0)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),            // give up after 8 seconds
    });
    if (!res.ok) return null;                        // 404, 500, etc.

    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("text/html")) return null;    // skip PDFs, images, etc.

    return (await res.text()).slice(0, 500_000);     // never read huge pages fully
  } catch {
    return null;                                     // network error / timeout
  }
}

/* ------------------------------------------------------------------ */
/* 4. Main function: cache → fetch → extract → save                   */
/* ------------------------------------------------------------------ */
export async function getSiteSummary(domain: string): Promise<string | null> {
  if (!isSafeDomain(domain)) return null;

  // 1. cache hit that is not older than CACHE_DAYS?
  const { data: cached } = await admin
    .from("site_cache")
    .select("summary, fetched_at")
    .eq("domain", domain)
    .maybeSingle();

  if (cached) {
    const ageMs = Date.now() - new Date(cached.fetched_at).getTime();
    if (ageMs < CACHE_DAYS * 24 * 60 * 60 * 1000) return cached.summary;
  }

  // 2. fetch homepage + extract text
  const html = await fetchHtml(`https://${domain}`);
  if (!html) return null;

  const text = extractText(html).slice(0, MAX_CHARS);
  if (text.length < MIN_CHARS) return null;

  // 3. save to cache for next time
  await admin.from("site_cache").upsert({
    domain,
    summary: text,
    fetched_at: new Date().toISOString(),
  });

  return text;
}