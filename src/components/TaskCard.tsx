import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/useTasks";

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onAssignToVox: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-primary/20 text-primary border-primary",
  },
  completed: {
    label: "Completed",
    className: "bg-green-500/20 text-green-400 border-green-500",
  },
  blocked: {
    label: "Blocked",
    className: "bg-amber-500/20 text-amber-400 border-amber-500",
  },
};

export function TaskCard({ task, onComplete, onAssignToVox, onDelete }: TaskCardProps) {
  const isInProgress = task.status === "in_progress";
  const isBlocked = task.status === "blocked" && task.assignee === "human";
  const isCompleted = task.status === "completed";

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        isInProgress && "ring-2 ring-primary/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]",
        isBlocked && "ring-2 ring-amber-500/50 border-amber-500/30",
        isCompleted && "opacity-60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={() => onComplete(task.id)}
              className="mt-1"
              disabled={isCompleted}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusConfig[task.status].className)}
                >
                  {statusConfig[task.status].label}
                </Badge>
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    task.assignee === "human"
                      ? "text-amber-400"
                      : "text-primary"
                  )}
                >
                  {task.assignee === "human" ? (
                    <User className="h-3 w-3" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                  <span className="capitalize">{task.assignee}</span>
                </div>
              </div>
              <h4
                className={cn(
                  "font-medium text-sm",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {task.assignee === "human" && !isCompleted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => onAssignToVox(task.id)}
                title="Assign to Vox"
              >
                <Bot className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(task.id)}
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
