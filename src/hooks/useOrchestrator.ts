import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PlanStep {
  label: string;
  agent: string;
  status: "pending" | "in-progress" | "completed";
}

interface StreamResult {
  content: string;
  plan: PlanStep[] | null;
}

export function useOrchestrator() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const streamChat = useCallback(async ({
    messages,
    onDelta,
    onPlan,
    onDone,
  }: {
    messages: Message[];
    onDelta: (deltaText: string) => void;
    onPlan: (plan: PlanStep[]) => void;
    onDone: () => void;
  }) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orchestrator`;

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "Unknown error" }));
      if (resp.status === 429) {
        toast({
          title: "Rate Limited",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive",
        });
      } else if (resp.status === 402) {
        toast({
          title: "Credits Required",
          description: "Please add credits to continue using the orchestrator.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorData.error || "Failed to connect to orchestrator",
          variant: "destructive",
        });
      }
      throw new Error(errorData.error || "Failed to start stream");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let fullContent = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullContent += content;
            onDelta(content);
            
            // Try to extract plan from accumulated content
            const planMatch = fullContent.match(/\{"plan":\s*\[[\s\S]*?\]\}/);
            if (planMatch) {
              try {
                const planData = JSON.parse(planMatch[0]);
                if (planData.plan && Array.isArray(planData.plan)) {
                  const steps: PlanStep[] = planData.plan.map((step: any) => ({
                    label: step.label,
                    agent: step.agent,
                    status: "pending" as const,
                  }));
                  onPlan(steps);
                }
              } catch {
                // Plan not complete yet
              }
            }
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  }, [toast]);

  const sendMessage = useCallback(async (
    userMessage: string,
    conversationHistory: Message[],
    callbacks: {
      onDelta: (text: string) => void;
      onPlan: (plan: PlanStep[]) => void;
      onDone: () => void;
    }
  ) => {
    setIsLoading(true);
    
    try {
      const messages: Message[] = [
        ...conversationHistory,
        { role: "user", content: userMessage },
      ];

      await streamChat({
        messages,
        onDelta: callbacks.onDelta,
        onPlan: callbacks.onPlan,
        onDone: () => {
          setIsLoading(false);
          callbacks.onDone();
        },
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [streamChat]);

  return { sendMessage, isLoading };
}
