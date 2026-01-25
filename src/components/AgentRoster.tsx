import { useState } from "react";
import { Search, FlaskConical, Code2, Pencil, CheckCircle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgents, type Agent } from "@/hooks/useAgents";

type AgentStatus = Agent["status"];

const iconMap: Record<string, React.ElementType> = {
  "Atlas": FlaskConical,
  "Nova": Code2,
  "Echo": Pencil,
  "Sentinel": CheckCircle,
};

const colorMap: Record<string, string> = {
  "Atlas": "text-agent-researcher",
  "Nova": "text-agent-coder",
  "Echo": "text-agent-copywriter",
  "Sentinel": "text-agent-reviewer",
};

function StatusIndicator({ status }: { status: AgentStatus }) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full",
        status === "active" && "bg-status-active status-pulse",
        status === "working" && "bg-status-active animate-pulse",
        status === "idle" && "bg-status-idle",
        status === "error" && "bg-destructive"
      )}
    />
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const Icon = iconMap[agent.name] || FlaskConical;
  const colorClass = colorMap[agent.name] || "text-primary";
  
  return (
    <div
      className={cn(
        "group p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-all cursor-pointer",
        agent.status === "active" && "border-primary/30 glow-border",
        agent.status === "working" && "border-status-active/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-md bg-muted", colorClass)}>
          {agent.status === "working" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
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
      
      {agent.status !== "error" && (
        <div className="mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tokens</span>
            <span className="font-mono text-primary">
              {agent.tokens_used.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000001";

export function AgentRoster() {
  const [searchQuery, setSearchQuery] = useState("");
  const { agents, isLoading, error } = useAgents(DEFAULT_PROJECT_ID);

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = agents.filter(a => a.status === "active" || a.status === "working").length;

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary status-pulse" />
          <h2 className="font-semibold text-sm">Agent Roster</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {activeCount} active
        </span>
      </div>
      
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-input border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      
      {/* Agent List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive text-sm">
            Failed to load agents
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No agents found
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))
        )}
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
