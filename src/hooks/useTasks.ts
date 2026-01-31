import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
type AssigneeType = Database["public"]["Enums"]["assignee_type"];

export interface Task {
  id: string;
  project_id: string | null;
  conversation_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: AssigneeType;
  order_index: number;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useTasks(conversationId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      let query = supabase
        .from("tasks")
        .select("*")
        .order("order_index", { ascending: true });

      if (conversationId) {
        query = query.eq("conversation_id", conversationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks(data || []);
      }
      setIsLoading(false);
    };

    fetchTasks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [...prev, payload.new as Task]);
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) =>
              prev.filter((task) => task.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const addTask = async (
    title: string,
    description: string | null,
    assignee: AssigneeType = "vox",
    conversationId?: string
  ) => {
    const nextIndex = tasks.length;
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title,
        description,
        assignee,
        conversation_id: conversationId,
        order_index: nextIndex,
        status: assignee === "human" ? "blocked" : "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding task:", error);
      return null;
    }
    return data;
  };

  const addMultipleTasks = async (
    taskList: Array<{ title: string; description: string | null; assignee: AssigneeType }>,
    conversationId?: string
  ) => {
    const startIndex = tasks.length;
    const tasksToInsert = taskList.map((task, index) => ({
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      conversation_id: conversationId,
      order_index: startIndex + index,
      status: task.assignee === "human" ? ("blocked" as TaskStatus) : ("pending" as TaskStatus),
    }));

    const { data, error } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error("Error adding tasks:", error);
      return null;
    }
    return data;
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Error updating task status:", error);
    }
  };

  const updateTaskAssignee = async (id: string, assignee: AssigneeType) => {
    const { error } = await supabase
      .from("tasks")
      .update({ 
        assignee,
        status: assignee === "human" ? "blocked" : "pending" 
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating task assignee:", error);
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
    }
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const inProgressTask = tasks.find((t) => t.status === "in_progress");

  return {
    tasks,
    isLoading,
    addTask,
    addMultipleTasks,
    updateTaskStatus,
    updateTaskAssignee,
    deleteTask,
    completedCount,
    totalCount: tasks.length,
    inProgressTask,
  };
}
