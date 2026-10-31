import { expect } from "vitest";

export function isSafeDomain(domain: string): boolean {

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) return false;

  
  if (
    domain === "localhost" ||
    domain.endsWith(".local") ||
    domain.endsWith(".internal")
  ) {
    return false;
  }


  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain);
}