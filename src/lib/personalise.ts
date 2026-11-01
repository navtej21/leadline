
export type Settings = {
  offer: string | null;
  icp: string | null;
  tone: string | null;
  sample_msg: string | null;
};

export function systemPrompt(s: Settings): string {
  return `You write short LinkedIn messages for a user.

What they sell: ${s.offer || "not provided"}
Who they sell to: ${s.icp || "not provided"}
Tone: ${s.tone || "friendly and direct"}

RULES
- Use only facts from the website summary. Never invent facts.
- opener: max 25 words, mention one fact about their company, no pitch.
- msg2: 2-3 sentences, link their situation to what the user sells, end with a question.
- msg3: 1-2 sentence friendly follow-up.
- Reply with JSON only: {"opener": "...", "msg2": "...", "msg3": "..."}`;
}


export type Lead = {
  first_name: string | null;
  company: string | null;
};

export function userPrompt(lead: Lead, summary: string): string {
  return `Name: ${lead.first_name || "there"}
Company: ${lead.company || "unknown"}

Website summary:
${summary}`;
}