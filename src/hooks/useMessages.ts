import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ToolCall } from "@/components/ToolCallBlock";

export interface PlanStep {
  id?: string;
  label: string;
  status: "pending" | "in-progress" | "completed";
  agent?: string;
}

export interface Message {
  id: string;
  role: "user" | "orchestrator" | "system" | "agent";
  content: string;
  timestamp: Date;
  plan?: PlanStep[];
  toolCalls?: ToolCall[];
  agentName?: string;
}

const DEFAULT_CONVERSATION_ID = "00000000-0000-0000-0000-000000000002";

export function useMessages(conversationId: string = DEFAULT_CONVERSATION_ID) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        const { data: messagesData, error } = await supabase
          .from("messages")
          .select(`
            id,
            role,
            content,
            created_at,
            agent_id,
            agents (name)
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Fetch plan steps for each message
        const messagesWithPlans: Message[] = await Promise.all(
          (messagesData || []).map(async (msg: any) => {
            const { data: stepsData } = await supabase
              .from("plan_steps")
              .select(`
                id,
                label,
                status,
                agents (name)
              `)
              .eq("message_id", msg.id)
              .order("order_index", { ascending: true });

            const plan = stepsData?.map((step: any) => ({
              id: step.id,
              label: step.label,
              status: step.status,
              agent: step.agents?.name,
            }));

            return {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at),
              plan: plan?.length ? plan : undefined,
              agentName: msg.agents?.name,
            };
          })
        );

        setMessages(messagesWithPlans);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [conversationId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Fetch agent name if needed
          let agentName: string | undefined;
          if (newMsg.agent_id) {
            const { data } = await supabase
              .from("agents")
              .select("name")
              .eq("id", newMsg.agent_id)
              .single();
            agentName = data?.name;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: newMsg.id,
              role: newMsg.role,
              content: newMsg.content,
              timestamp: new Date(newMsg.created_at),
              agentName,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const addMessage = useCallback(async (
    role: Message["role"],
    content: string,
    plan?: { label: string; agent: string; status: "pending" | "in-progress" | "completed" }[]
  ) => {
    // Insert message
    const { data: msgData, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })
      .select()
      .single();

    if (msgError) {
      console.error("Failed to insert message:", msgError);
      return null;
    }

    // Insert plan steps if provided
    if (plan && msgData) {
      const stepsToInsert = await Promise.all(
        plan.map(async (step, index) => {
          // Look up agent ID by name
          const { data: agentData } = await supabase
            .from("agents")
            .select("id")
            .eq("name", step.agent)
            .maybeSingle();

          return {
            message_id: msgData.id,
            label: step.label,
            status: step.status,
            agent_id: agentData?.id || null,
            order_index: index,
          };
        })
      );

      await supabase.from("plan_steps").insert(stepsToInsert);
    }

    return msgData;
  }, [conversationId]);

  const addLocalMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateLocalMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  return { 
    messages, 
    isLoading, 
    addMessage, 
    addLocalMessage, 
    updateLocalMessage 
  };
}
