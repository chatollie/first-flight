import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  status: "active" | "idle" | "working" | "error";
  tokens_used: number;
  system_prompt: string | null;
}

export function useAgents(projectId?: string) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        let query = supabase.from("agents").select("*");
        
        if (projectId) {
          query = query.eq("project_id", projectId);
        }
        
        const { data, error } = await query.order("created_at", { ascending: true });
        
        if (error) throw error;
        
        setAgents(data as Agent[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch agents"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgents();
  }, [projectId]);

  const updateAgentStatus = async (agentId: string, status: Agent["status"]) => {
    const { error } = await supabase
      .from("agents")
      .update({ status })
      .eq("id", agentId);
    
    if (!error) {
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, status } : a
      ));
    }
    
    return { error };
  };

  const updateAgentTokens = async (agentId: string, tokensToAdd: number) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return { error: new Error("Agent not found") };

    const newTokens = agent.tokens_used + tokensToAdd;
    
    const { error } = await supabase
      .from("agents")
      .update({ tokens_used: newTokens })
      .eq("id", agentId);
    
    if (!error) {
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, tokens_used: newTokens } : a
      ));
    }
    
    return { error };
  };

  return { agents, isLoading, error, updateAgentStatus, updateAgentTokens };
}
