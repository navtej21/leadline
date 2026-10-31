export function normalizeDomain(input: string): string | null {
  const s = input.trim();                       // remove spaces around
  if (!s) return null;                          // Test 5: empty → null


  const withProtocol = /^https?:\/\//i.test(s) ? s : `https://${s}`;

  try {
    const host = new URL(withProtocol).hostname // Test 3: drops path, ?query, port
      .toLowerCase()                            // ZOHO.COM → zoho.com
      .replace(/^www\./, "");                   // Test 2: strip www. only at the start
    return host.includes(".") ? host : null;    // "localhost" → null
  } catch {
    return null;                                // invalid input like "not a website"
  }
}