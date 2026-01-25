import { Search, FlaskConical, Code2, Pencil, CheckCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentStatus = "active" | "idle" | "offline";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  tokens: number;
  icon: React.ElementType;
  colorClass: string;
}

const agents: Agent[] = [
  {
    id: "researcher",
    name: "Atlas",
    role: "Researcher",
    status: "active",
    tokens: 12450,
    icon: FlaskConical,
    colorClass: "text-agent-researcher",
  },
  {
    id: "coder",
    name: "Nova",
    role: "Coder",
    status: "active",
    tokens: 8920,
    icon: Code2,
    colorClass: "text-agent-coder",
  },
  {
    id: "copywriter",
    name: "Echo",
    role: "Copywriter",
    status: "idle",
    tokens: 3200,
    icon: Pencil,
    colorClass: "text-agent-copywriter",
  },
  {
    id: "reviewer",
    name: "Sentinel",
    role: "Reviewer",
    status: "offline",
    tokens: 0,
    icon: CheckCircle,
    colorClass: "text-agent-reviewer",
  },
];

function StatusIndicator({ status }: { status: AgentStatus }) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full",
        status === "active" && "bg-status-active status-pulse",
        status === "idle" && "bg-status-idle",
        status === "offline" && "bg-status-offline"
      )}
    />
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const Icon = agent.icon;
  
  return (
    <div
      className={cn(
        "group p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-all cursor-pointer",
        agent.status === "active" && "border-primary/30 glow-border"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-md bg-muted", agent.colorClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-foreground truncate">
              {agent.name}
            </h3>
            <StatusIndicator status={agent.status} />
          </div>
          <p className="text-xs text-muted-foreground">{agent.role}</p>
        </div>
      </div>
      
      {agent.status !== "offline" && (
        <div className="mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tokens</span>
            <span className="font-mono text-primary">
              {agent.tokens.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentRoster() {
  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary status-pulse" />
          <h2 className="font-semibold text-sm">Agent Roster</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {agents.filter(a => a.status === "active").length} active
        </span>
      </div>
      
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search agents..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-input border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      
      {/* Agent List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
      
      {/* Add Agent Button */}
      <div className="p-3 border-t border-border">
        <button className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/50 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Agent</span>
        </button>
      </div>
    </div>
  );
}
