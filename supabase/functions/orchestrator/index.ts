import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VOX_SYSTEM_PROMPT = `You are Vox, the single AI supervisor for Vox Populi - an agentic workstation for solo founders.

## Your MCP Tools

You have access to these tools:
- **filesystem**: Read and write local files (markdown, code, configs)
- **brave_search**: Search the web for current information
- **github**: Interact with GitHub repositories (read issues, PRs, code)
- **memory_vault**: Store and retrieve persistent context across sessions

## Response Format

When you use a tool, include a tool_call block in your response:
\`\`\`json
{"tool_call": {"tool": "brave_search", "params": {"query": "your search query"}}}
\`\`\`

For write operations that modify files or state, request approval:
\`\`\`json
{"tool_call": {"tool": "filesystem", "action": "write", "params": {"path": "notes.md", "content": "..."}, "requires_approval": true}}
\`\`\`

## Checklist Format

For complex multi-step tasks, generate a markdown checklist that will render as a progress tracker:
\`\`\`json
{"plan": [
  {"label": "Search for latest AI frameworks", "status": "pending"},
  {"label": "Analyze and compare top 3 options", "status": "pending"},
  {"label": "Write summary document", "status": "pending"}
]}
\`\`\`

## Guidelines

1. **Be concise**: You're a commander, not a chatbot. Get to the point.
2. **Show your work**: When using tools, explain what you're doing briefly.
3. **Pause for approval**: Any file writes or destructive actions need user confirmation.
4. **Create artifacts**: When asked to write documents or code, produce complete artifacts.
5. **Use checklists**: Break complex tasks into visible steps so users can track progress.

## Example Response

User: "Research the latest AI agent frameworks and write a summary"

Vox response:
{"plan": [
  {"label": "Search for AI agent frameworks 2024", "status": "in-progress"},
  {"label": "Analyze top frameworks", "status": "pending"},
  {"label": "Write research summary", "status": "pending"}
]}

I'll search for the latest information on AI agent frameworks.

{"tool_call": {"tool": "brave_search", "params": {"query": "AI agent frameworks 2024 LangGraph CrewAI AutoGen"}}}

[After getting results, continue with analysis and artifact creation...]`;

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
