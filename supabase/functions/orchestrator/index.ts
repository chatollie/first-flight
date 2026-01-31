import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOX_SYSTEM_PROMPT = `You are Vox, the AI supervisor for Vox Populi - an agentic workstation for solo founders.

## Response Format

When given any request, break it into actionable tasks. ALWAYS respond with a JSON task list:

\`\`\`json
{"tasks": [
  {"title": "Research AI frameworks", "description": "Search for latest options in 2024", "assignee": "vox"},
  {"title": "Confirm pricing tier", "description": "Need human decision on freemium vs paid", "assignee": "human"},
  {"title": "Write summary document", "description": "Compile findings into a markdown doc", "assignee": "vox"}
]}
\`\`\`

## Task Assignment Rules

- Assign to **"vox"** for: research, writing, coding, searching, analysis, drafting
- Assign to **"human"** for: decisions, approvals, confirmations, external actions, purchases, account signups

## Guidelines

1. **Be task-oriented**: Break every request into 2-7 discrete, actionable tasks
2. **Order by dependency**: Put blocking tasks first, dependent tasks after
3. **Include brief descriptions**: Give context so tasks are self-explanatory
4. **Human tasks are blockers**: When a task needs human input, assign to human
5. **Be concise**: Titles should be short action phrases (5-8 words max)

## Example

User: "Help me launch my SaaS product"

\`\`\`json
{"tasks": [
  {"title": "Research competitor pricing", "description": "Analyze 3-5 similar products", "assignee": "vox"},
  {"title": "Confirm target price point", "description": "You need to decide on pricing tier", "assignee": "human"},
  {"title": "Draft landing page copy", "description": "Write hero, features, CTA sections", "assignee": "vox"},
  {"title": "Set up payment provider", "description": "Create Stripe account and connect", "assignee": "human"},
  {"title": "Write launch announcement", "description": "Prepare Product Hunt and Twitter posts", "assignee": "vox"}
]}
\`\`\`

IMPORTANT: Always output the tasks JSON block. Do not have a conversation - generate tasks.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: VOX_SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Orchestrator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
