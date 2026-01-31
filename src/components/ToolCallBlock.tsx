import { HardDrive, Globe, Github, Database, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolCallStatus = "pending" | "executing" | "completed" | "error";

export interface ToolCall {
  id: string;
  tool: string;
  action?: string;
  params?: Record<string, unknown>;
  status: ToolCallStatus;
  result?: string;
  requires_approval?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  filesystem: HardDrive,
  brave_search: Globe,
  github: Github,
  memory_vault: Database,
};

const toolDisplayNames: Record<string, string> = {
  filesystem: "Filesystem",
  brave_search: "Brave Search",
  github: "GitHub",
  memory_vault: "Memory Vault",
};

interface ToolCallBlockProps {
  toolCall: ToolCall;
  onApprove?: (toolCallId: string) => void;
  onReject?: (toolCallId: string) => void;
}

export function ToolCallBlock({ toolCall, onApprove, onReject }: ToolCallBlockProps) {
  const Icon = iconMap[toolCall.tool] || HardDrive;
  const displayName = toolDisplayNames[toolCall.tool] || toolCall.tool;

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "executing":
        return <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" />;
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-status-active" />;
      case "error":
        return <XCircle className="w-3.5 h-3.5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case "pending":
        return "Pending...";
      case "executing":
        return "Executing...";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "my-2 p-3 rounded-lg border bg-muted/30",
        toolCall.status === "executing" && "border-yellow-500/30",
        toolCall.status === "completed" && "border-status-active/30",
        toolCall.status === "error" && "border-destructive/30",
        toolCall.status === "pending" && "border-border"
      )}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">
          Using {displayName}
        </span>
        {getStatusIcon()}
        <span className="text-xs text-muted-foreground ml-auto">
          {getStatusText()}
        </span>
      </div>

      {/* Show params if present */}
      {toolCall.params && Object.keys(toolCall.params).length > 0 && (
        <div className="mt-2 pl-8">
          {Object.entries(toolCall.params).map(([key, value]) => (
            <div key={key} className="text-xs">
              <span className="text-muted-foreground">{key}: </span>
              <span className="text-foreground font-mono">
                {typeof value === "string" ? `"${value}"` : JSON.stringify(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Show result if completed */}
      {toolCall.status === "completed" && toolCall.result && (
        <div className="mt-2 pl-8 text-xs text-muted-foreground">
          {toolCall.result}
        </div>
      )}

      {/* HITL Approval Gate */}
      {toolCall.requires_approval && toolCall.status === "pending" && (
        <div className="mt-3 pt-2 border-t border-border/50 flex gap-2">
          <button
            onClick={() => onApprove?.(toolCall.id)}
            className="flex-1 py-1.5 px-3 text-xs font-medium bg-status-active/10 text-status-active hover:bg-status-active/20 rounded-md transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onReject?.(toolCall.id)}
            className="flex-1 py-1.5 px-3 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
