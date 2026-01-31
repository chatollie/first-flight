import { useState, useRef, useCallback } from "react";
import { Bot, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TaskCard } from "@/components/TaskCard";
import { SprintProgress } from "@/components/SprintProgress";
import { useTasks } from "@/hooks/useTasks";
import { useOrchestrator } from "@/hooks/useOrchestrator";
import { cn } from "@/lib/utils";

export function TaskConsole() {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const taskRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const {
    tasks,
    isLoading: tasksLoading,
    addTask,
    addMultipleTasks,
    updateTaskStatus,
    updateTaskAssignee,
    deleteTask,
    completedCount,
  } = useTasks();

  const { sendMessage, isLoading } = useOrchestrator();

  const scrollToTask = useCallback((taskId: string) => {
    const taskElement = taskRefs.current.get(taskId);
    if (taskElement) {
      taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleComplete = async (id: string) => {
    await updateTaskStatus(id, "completed");
  };

  const handleAssignToVox = async (id: string) => {
    await updateTaskAssignee(id, "vox");
  };

  const handleDelete = async (id: string) => {
    await deleteTask(id);
  };

  const parseTasksFromResponse = (content: string) => {
    // Try to find JSON task list in the response
    const jsonMatch = content.match(/\{"tasks":\s*\[[\s\S]*?\]\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.tasks)) {
          return parsed.tasks.map((t: any) => ({
            title: t.title || "Untitled Task",
            description: t.description || null,
            assignee: t.assignee === "human" ? "human" : "vox",
          }));
        }
      } catch (e) {
        console.error("Failed to parse tasks JSON:", e);
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming || isLoading) return;

    const userInput = input.trim();
    setInput("");

    // Check if it's a direct task creation (starts with "Task:" or similar)
    const directTaskMatch = userInput.match(/^task:\s*(.+)/i);
    if (directTaskMatch) {
      await addTask(directTaskMatch[1], null, "human");
      return;
    }

    // Otherwise, send to Vox orchestrator
    setIsStreaming(true);
    let fullContent = "";

    try {
      await sendMessage(userInput, [], {
        onDelta: (text) => {
          fullContent += text;
        },
        onPlan: () => {
          // Plan steps not used in task console
        },
        onDone: async () => {
          setIsStreaming(false);
          // Parse tasks from Vox's response
          const parsedTasks = parseTasksFromResponse(fullContent);
          if (parsedTasks && parsedTasks.length > 0) {
            await addMultipleTasks(parsedTasks);
          }
        },
      });
    } catch (error) {
      console.error("Error sending message to Vox:", error);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isWorking = isStreaming || isLoading;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold">Task Console</h2>
        <div className="flex items-center gap-2 text-sm">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isWorking ? "bg-amber-400 animate-pulse" : "bg-green-400"
            )}
          />
          <span className="text-muted-foreground">
            {isWorking ? "Vox Working..." : "Vox Online"}
          </span>
          <Bot className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Sprint Progress */}
      <SprintProgress
        tasks={tasks}
        completedCount={completedCount}
        onTaskClick={scrollToTask}
      />

      {/* Task Feed */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-3">
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No tasks yet.</p>
              <p className="text-xs mt-1">
                Tell Vox what you need, or type "Task:" to add one directly.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                ref={(el) => {
                  if (el) taskRefs.current.set(task.id, el);
                }}
              >
                <TaskCard
                  task={task}
                  onComplete={handleComplete}
                  onAssignToVox={handleAssignToVox}
                  onDelete={handleDelete}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Command Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task or tell Vox what to do..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isWorking}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isWorking}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isWorking ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tip: Start with "Task:" to add a task directly, or describe what you
          need and Vox will break it into tasks.
        </p>
      </div>
    </div>
  );
}
