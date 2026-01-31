import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Artifact {
  id: string;
  project_id: string | null;
  conversation_id: string | null;
  title: string;
  content: string;
  content_type: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export function useArtifacts(projectId?: string) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchArtifacts() {
      try {
        let query = supabase.from("artifacts").select("*");
        
        if (projectId) {
          query = query.eq("project_id", projectId);
        }
        
        const { data, error } = await query.order("updated_at", { ascending: false });
        
        if (error) throw error;
        
        const artifactsList = data as Artifact[];
        setArtifacts(artifactsList);
        
        // Set the most recent artifact as current
        if (artifactsList.length > 0 && !currentArtifact) {
          setCurrentArtifact(artifactsList[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch artifacts"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchArtifacts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("artifacts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "artifacts",
          filter: projectId ? `project_id=eq.${projectId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newArtifact = payload.new as Artifact;
            setArtifacts((prev) => [newArtifact, ...prev]);
            setCurrentArtifact(newArtifact);
          } else if (payload.eventType === "UPDATE") {
            const updatedArtifact = payload.new as Artifact;
            setArtifacts((prev) =>
              prev.map((a) => (a.id === updatedArtifact.id ? updatedArtifact : a))
            );
            // Update current artifact if it's the one being updated
            setCurrentArtifact((prev) =>
              prev?.id === updatedArtifact.id ? updatedArtifact : prev
            );
          } else if (payload.eventType === "DELETE") {
            setArtifacts((prev) => prev.filter((a) => a.id !== payload.old.id));
            // Clear current if it was deleted
            setCurrentArtifact((prev) =>
              prev?.id === payload.old.id ? null : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const createArtifact = async (
    title: string,
    content: string,
    contentType: string = "markdown"
  ) => {
    const { data, error } = await supabase
      .from("artifacts")
      .insert({
        project_id: projectId,
        title,
        content,
        content_type: contentType,
        version: 1,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    const newArtifact = data as Artifact;
    setCurrentArtifact(newArtifact);
    return { data: newArtifact, error: null };
  };

  const updateArtifact = async (
    artifactId: string,
    updates: { title?: string; content?: string }
  ) => {
    // Get current version to increment
    const artifact = artifacts.find((a) => a.id === artifactId);
    const newVersion = (artifact?.version || 0) + 1;

    const { data, error } = await supabase
      .from("artifacts")
      .update({ ...updates, version: newVersion })
      .eq("id", artifactId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Artifact, error: null };
  };

  const selectArtifact = (artifactId: string) => {
    const artifact = artifacts.find((a) => a.id === artifactId);
    if (artifact) {
      setCurrentArtifact(artifact);
    }
  };

  return {
    artifacts,
    currentArtifact,
    isLoading,
    error,
    createArtifact,
    updateArtifact,
    selectArtifact,
  };
}
