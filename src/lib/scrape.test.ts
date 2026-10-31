import { test, expect } from "vitest";
import { extractHtml, isSafeDomain } from "./domain/safedomain";


test("allows a normal domain", () => {
  expect(isSafeDomain("zoho.com")).toBe(true);
});

test("blocks IP addresses", () => {
  expect(isSafeDomain("127.0.0.1")).toBe(false);
  expect(isSafeDomain("169.254.169.254")).toBe(false);
});


test("blocks localhost and internal hosts", () => {
  expect(isSafeDomain("localhost")).toBe(false);
  expect(isSafeDomain("printer.local")).toBe(false);
});


test("allows subdomains and country domains", () => {
  expect(isSafeDomain("app.zoho.com")).toBe(true);
  expect(isSafeDomain("tcs.co.in")).toBe(true);
});


test("keep the title",()=>{
    const html="<html><head><title>Zoho</title></head></html>";
    expect(extractHtml(html)).toBe("Title: zoho");
})


test("empty page gives an empty string",()=>{
    const html="";
    expect(extractHtml(html)).toBe("");
})


test("keeps the meta description", () => {
  const html = `<html><head>
    <title>Zoho</title>
    <meta name="description" content="Business software for everyone.">
  </head></html>`;
  expect(extractHtml(html)).toBe("Title: Zoho\nDescription: Business software for everyone.");
});