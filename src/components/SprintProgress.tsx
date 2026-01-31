import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/useTasks";

interface SprintProgressProps {
  tasks: Task[];
  completedCount: number;
  onTaskClick: (taskId: string) => void;
}

export function SprintProgress({ tasks, completedCount, onTaskClick }: SprintProgressProps) {
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (totalCount === 0) {
    return (
      <div className="p-4 border-b border-border/50">
        <div className="text-sm text-muted-foreground text-center">
          No tasks yet. Add a task or tell Vox what to do.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-border/50 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Current Sprint</span>
        <span className="text-muted-foreground">
          {completedCount}/{totalCount} tasks done
        </span>
      </div>

      <Progress value={progressPercent} className="h-2" />

      <div className="flex flex-wrap gap-2">
        {tasks.slice(0, 6).map((task) => (
          <Badge
            key={task.id}
            variant="outline"
            className={cn(
              "cursor-pointer text-xs transition-all",
              task.status === "completed" && "bg-green-500/10 border-green-500/30 text-green-400",
              task.status === "in_progress" && "bg-primary/10 border-primary/30 text-primary animate-pulse",
              task.status === "pending" && "bg-muted border-muted-foreground/30 text-muted-foreground",
              task.status === "blocked" && "bg-amber-500/10 border-amber-500/30 text-amber-400"
            )}
            onClick={() => onTaskClick(task.id)}
          >
            {task.title.length > 15 ? task.title.slice(0, 15) + "..." : task.title}
          </Badge>
        ))}
        {tasks.length > 6 && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            +{tasks.length - 6} more
          </Badge>
        )}
      </div>
    </div>
  );
}
