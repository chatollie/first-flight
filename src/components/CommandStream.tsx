import { useState } from "react";
import { Send, Zap, CheckCircle2, Circle, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanStep {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed";
  agent?: string;
}

interface Message {
  id: string;
  role: "user" | "orchestrator" | "system";
  content: string;
  timestamp: Date;
  plan?: PlanStep[];
}

const mockMessages: Message[] = [
  {
    id: "1",
    role: "system",
    content: "Vox Populi initialized. All agents standing by.",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    role: "user",
    content: "Research the latest trends in AI agent orchestration and create a technical brief.",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: "3",
    role: "orchestrator",
    content: "Understood. I'm deploying a multi-agent workflow to handle this request.",
    timestamp: new Date(Date.now() - 230000),
    plan: [
      { id: "s1", label: "Deep research on AI orchestration patterns", status: "completed", agent: "Atlas" },
      { id: "s2", label: "Synthesize findings into structured brief", status: "in-progress", agent: "Echo" },
      { id: "s3", label: "Code review for technical accuracy", status: "pending", agent: "Sentinel" },
    ],
  },
];

function PlanStepper({ steps }: { steps: PlanStep[] }) {
  return (
    <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Execution Plan</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="pt-0.5">
              {step.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-status-active" />
              ) : step.status === "in-progress" ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className={cn(
                "text-sm",
                step.status === "completed" && "text-muted-foreground line-through",
                step.status === "in-progress" && "text-foreground",
                step.status === "pending" && "text-muted-foreground"
              )}>
                {step.label}
              </p>
              {step.agent && (
                <span className="text-xs text-primary">@{step.agent}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  
  return (
    <div className={cn(
      "animate-fade-in",
      isUser && "flex justify-end"
    )}>
      <div className={cn(
        "max-w-[85%] rounded-lg p-3",
        isUser && "bg-primary text-primary-foreground",
        message.role === "orchestrator" && "bg-secondary border border-border",
        isSystem && "bg-muted/30 border border-dashed border-border"
      )}>
        {isSystem && (
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">System</span>
          </div>
        )}
        <p className="text-sm">{message.content}</p>
        {message.plan && <PlanStepper steps={message.plan} />}
        <p className={cn(
          "text-xs mt-2",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export function CommandStream() {
  const [input, setInput] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    // In a real app, this would send the message
    setInput("");
  };
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="panel-header border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Command Stream</h2>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Orchestrator Online
        </span>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 grid-bg">
        {mockMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
      
      {/* Approval Gate Example */}
      <div className="mx-4 mb-2 p-3 bg-status-idle/10 border border-status-idle/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-status-idle" />
          <span className="text-xs font-medium text-status-idle">Approval Required</span>
        </div>
        <p className="text-sm text-foreground mb-3">
          Nova wants to write to <code className="text-primary font-mono text-xs">src/components/Brief.tsx</code>
        </p>
        <div className="flex gap-2">
          <button className="flex-1 py-1.5 px-3 text-xs font-medium bg-status-active text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
            Approve
          </button>
          <button className="flex-1 py-1.5 px-3 text-xs font-medium bg-destructive/20 text-destructive border border-destructive/30 rounded-md hover:bg-destructive/30 transition-colors">
            Deny
          </button>
        </div>
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your command..."
            className="w-full pl-4 pr-12 py-3 text-sm bg-input border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
