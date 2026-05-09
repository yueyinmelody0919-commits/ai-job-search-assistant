/**
 * Claude API integration (Anthropic).
 * Powers scoring, email drafting, agent reasoning, and analysis.
 */

import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Send a message to Claude and get a response.
 */
export async function chat(
  systemPrompt: string,
  messages: ClaudeMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: options?.model ?? "claude-sonnet-4-20250514",
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

/**
 * Score a job using Claude with structured JSON output.
 */
export async function scoreJob(
  systemPrompt: string,
  jobPrompt: string
): Promise<Record<string, unknown>> {
  const response = await chat(
    systemPrompt,
    [{ role: "user", content: jobPrompt }],
    { temperature: 0.3, maxTokens: 2048 }
  );

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = response.match(/```json\s*([\s\S]*?)```/) ||
    response.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Failed to extract JSON from Claude scoring response");
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  return JSON.parse(jsonStr);
}

/**
 * Draft a personalized outreach email.
 */
export async function draftEmail(
  jobTitle: string,
  company: string,
  jobDescription: string,
  scoreSummary: string,
  recipientName?: string
): Promise<{ subject: string; body: string }> {
  const prompt = `Draft a personalized outreach email for this job opportunity.

JOB: ${jobTitle} at ${company}
${recipientName ? `TO: ${recipientName}` : ""}

JOB DESCRIPTION (excerpt):
${jobDescription.slice(0, 1500)}

FIT ANALYSIS:
${scoreSummary}

ABOUT THE SENDER (Melody Yin):
- Team Lead, Marketing Strategy & Operations at Mixpanel (Director-level scope)
- Wharton MBA, former BCG consultant
- Deployed AI workflows at Mixpanel: AI SDR, intent-based outbound ($10M+ pipeline)
- Led marketing ops standalone team, 3 direct reports
- Reduced lead-to-opportunity velocity from 60-90 days to 20-30 days

Write a concise, warm email that:
1. References something specific about the company/role
2. Highlights 1-2 most relevant experiences
3. Is direct and not salesy
4. Keeps it under 200 words

Return JSON: { "subject": "...", "body": "..." }`;

  const response = await chat(
    "You are a professional networking email writer. Write concise, genuine emails — never generic or templated. Return only valid JSON.",
    [{ role: "user", content: prompt }],
    { temperature: 0.7 }
  );

  const jsonMatch = response.match(/```json\s*([\s\S]*?)```/) ||
    response.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return {
      subject: `Re: ${jobTitle} at ${company}`,
      body: response,
    };
  }

  return JSON.parse(jsonMatch[1] || jsonMatch[0]);
}

/**
 * Generate an agent response with a specific persona.
 */
export async function agentRespond(
  personaSystemPrompt: string,
  userMessage: string,
  conversationHistory: ClaudeMessage[] = []
): Promise<string> {
  const messages: ClaudeMessage[] = [
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  return chat(personaSystemPrompt, messages, {
    temperature: 0.8,
    maxTokens: 1024,
  });
}
