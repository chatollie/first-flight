import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ToolStatus = "ready" | "executing" | "error";

export interface MCPConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface Tool {
  id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  is_enabled: boolean;
  requires_api_key: boolean;
  api_key_env_name: string | null;
  status: ToolStatus;
  config?: MCPConfig;
  created_at: string;
  updated_at: string;
}

export function useTools(projectId?: string) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTools() {
      try {
        let query = supabase.from("tools").select("*");
        
        if (projectId) {
          query = query.eq("project_id", projectId);
        }
        
        const { data, error } = await query.order("created_at", { ascending: true });
        
        if (error) throw error;
        
        // Map the data to our Tool type, handling config properly
        const mappedTools = (data || []).map((tool) => ({
          ...tool,
          config: tool.config as unknown as MCPConfig | undefined,
        })) as Tool[];
        
        setTools(mappedTools);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch tools"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchTools();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("tools-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tools",
          filter: projectId ? `project_id=eq.${projectId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTools((prev) => [...prev, payload.new as Tool]);
          } else if (payload.eventType === "UPDATE") {
            setTools((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Tool) : t))
            );
          } else if (payload.eventType === "DELETE") {
            setTools((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const toggleTool = async (toolId: string, isEnabled: boolean) => {
    const { error } = await supabase
      .from("tools")
      .update({ is_enabled: isEnabled })
      .eq("id", toolId);
    
    if (!error) {
      setTools((prev) =>
        prev.map((t) => (t.id === toolId ? { ...t, is_enabled: isEnabled } : t))
      );
    }
    
    return { error };
  };

  const updateToolStatus = async (toolId: string, status: ToolStatus) => {
    const { error } = await supabase
      .from("tools")
      .update({ status })
      .eq("id", toolId);
    
    if (!error) {
      setTools((prev) =>
        prev.map((t) => (t.id === toolId ? { ...t, status } : t))
      );
    }
    
    return { error };
  };

  const getEnabledTools = () => tools.filter((t) => t.is_enabled);

  return {
    tools,
    isLoading,
    error,
    toggleTool,
    updateToolStatus,
    getEnabledTools,
  };
}
