import {test,expect} from "vitest";
import { systemPrompt } from "./personalise";
import {userPrompt} from "./personalise";




test("system prompt includes what the user sells", () => {
  const settings = { offer: "LinkedIn outreach", icp: null, tone: null, sample_msg: null };
  expect(systemPrompt(settings)).toContain("LinkedIn outreach");
});


test("system prompt includes who they are selling to",()=>{
    const settings = { offer: "LinkedIn outreach", icp: "B2B SaaS founders", tone: null, sample_msg: null };
    expect(systemPrompt(settings)).toContain("B2B SaaS founders");
})


test("system prompt includes the tone of the message",()=>{
    const settings = { offer: "LinkedIn outreach", icp: "B2B SaaS founders", tone: "friendly", sample_msg: null };
    expect(systemPrompt(settings)).toContain("friendly");
})


test("system prompt never says 'null'", () => {
  const empty = { offer: null, icp: null, tone: null, sample_msg: null };
  expect(systemPrompt(empty)).not.toContain("null");
});


test("system prompt tells Claude not to invent facts", () => {
  const empty = { offer: null, icp: null, tone: null, sample_msg: null };
  expect(systemPrompt(empty)).toContain("Never invent");
});

test("user prompt includes the lead's name", () => {
  const lead = { first_name: "Priya", company: "Zoho" };
  expect(userPrompt(lead, "some summary")).toContain("Priya");
});

test("user prompt name becomes there when missing",()=>{
    const lead = { first_name: null, company: "Zoho" };
  expect(userPrompt(lead, "some summary")).toContain("Name: there");
});

test("user prompt includes company and website summary", () => {
  const lead = { first_name: "Priya", company: "Zoho" };
  const p = userPrompt(lead, "Zoho makes business software");
  expect(p).toContain("Company: Zoho");
  expect(p).toContain("Zoho makes business software");
});