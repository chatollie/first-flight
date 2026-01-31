import { useState } from "react";
import { Settings, HardDrive, Globe, Github, Database, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import type { Tool, ToolStatus } from "@/hooks/useTools";

const iconMap: Record<string, React.ElementType> = {
  HardDrive,
  Globe,
  Github,
  Database,
};

function StatusIndicator({ status }: { status: ToolStatus }) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full",
        status === "ready" && "bg-status-active",
        status === "executing" && "bg-yellow-500 animate-pulse",
        status === "error" && "bg-destructive"
      )}
    />
  );
}

interface ToolCardProps {
  tool: Tool;
  onToggle: (toolId: string, isEnabled: boolean) => void;
  onConfigure?: (tool: Tool) => void;
}

export function ToolCard({ tool, onToggle, onConfigure }: ToolCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = iconMap[tool.icon] || HardDrive;
  
  const handleToggle = (checked: boolean) => {
    onToggle(tool.id, checked);
  };

  return (
    <div
      className={cn(
        "group p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-all",
        tool.is_enabled && tool.status === "ready" && "border-primary/30",
        tool.status === "executing" && "border-yellow-500/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-md bg-muted",
          tool.is_enabled ? "text-primary" : "text-muted-foreground"
        )}>
          {tool.status === "executing" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-medium text-sm truncate",
              tool.is_enabled ? "text-foreground" : "text-muted-foreground"
            )}>
              {tool.name}
            </h3>
            <StatusIndicator status={tool.status} />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {tool.description}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={tool.is_enabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-primary"
          />
          <span className="text-xs text-muted-foreground">
            {tool.is_enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        
        {tool.requires_api_key && (
          <button
            onClick={() => onConfigure?.(tool)}
            className={cn(
              "p-1.5 rounded-md transition-all",
              isHovered ? "opacity-100" : "opacity-0",
              "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
            title="Configure API Key"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
